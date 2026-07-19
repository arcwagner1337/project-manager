using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using test_task.Data;
using test_task.Models;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 1. Конфигурация Identity
builder.Services.AddIdentity<Employee, IdentityRole<int>>(options =>
{
    options.Password.RequiredLength = 4;
    options.Password.RequireDigit = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// 2. Настройка Кук под API (без редиректов на несуществующие страницы)
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.SecurePolicy = CookieSecurePolicy.None;
    options.Cookie.SameSite = SameSiteMode.Lax;

    options.Events = new Microsoft.AspNetCore.Authentication.Cookies.CookieAuthenticationEvents
    {
        OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        },
        // ЭТОЙ ЧАСТИ ТЕБЕ НЕ ХВАТАЛО:
        OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        }
    };
});
// 3. CORS с поддержкой Credentials (куки)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://192.168.31.118:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // ОБЯЗАТЕЛЬНО для кук!
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactApp");

//app.UseHttpsRedirection();

// ПОРЯДОК: Сначала Аутентификация, затем Авторизация
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// 4. Магия автоматических миграций в Docker + сидинг ролей
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();

        // Эта строчка сама накатит миграции на твой докер-контейнер базы при старте приложения!
        context.Database.Migrate();

        var roleManager = services.GetRequiredService<RoleManager<IdentityRole<int>>>();
        var userManager = services.GetRequiredService<UserManager<Employee>>();

        // Сидинг ролей
        string[] roles = { "Leader", "ProjectManager", "Employee" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<int> { Name = role });
            }
        }

        // ====================================================================
        // 1. УПРАВЛЕНИЕ РУКОВОДИТЕЛЕМ (Leader)
        // ====================================================================
        string adminEmail = "leader@test.com";
        var leader = await userManager.FindByEmailAsync(adminEmail);

        if (leader == null)
        {
            leader = new Employee
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "арквагнер",
                LastName = "Администратор",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(leader, "admin123");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(leader, "Leader");
            }
        }
        else
        {
            // Если админ уже есть в базе, но без роли — принудительно привязываем её
            if (!await userManager.IsInRoleAsync(leader, "Leader"))
            {
                await userManager.AddToRoleAsync(leader, "Leader");
            }
        }

        // ====================================================================
        // 2. УПРАВЛЕНИЕ ПРОЕКТНЫМИ МЕНЕДЖЕРАМИ (PM)
        // ====================================================================
        for (int i = 1; i <= 2; i++)
        {
            var pmEmail = $"pm{i}@test.com";
            var pm = await userManager.FindByEmailAsync(pmEmail);

            if (pm == null)
            {
                pm = new Employee
                {
                    UserName = pmEmail,
                    Email = pmEmail,
                    FirstName = $"Иван{i}",
                    LastName = $"Менеджеров{i}",
                    EmailConfirmed = true
                };
                var resultPm = await userManager.CreateAsync(pm, "password123");
                if (resultPm.Succeeded)
                {
                    await userManager.AddToRoleAsync(pm, "ProjectManager");
                }
            }
            else
            {
                // Если PM существует, проверяем его роль
                if (!await userManager.IsInRoleAsync(pm, "ProjectManager"))
                {
                    await userManager.AddToRoleAsync(pm, "ProjectManager");
                }
            }
        }

        // ====================================================================
        // 3. УПРАВЛЕНИЕ ОБЫЧНЫМИ СОТРУДНИКАМИ (Employee)
        // ====================================================================
        for (int i = 1; i <= 3; i++)
        {
            var empEmail = $"worker{i}@test.com";
            var worker = await userManager.FindByEmailAsync(empEmail);

            if (worker == null)
            {
                worker = new Employee
                {
                    UserName = empEmail,
                    Email = empEmail,
                    FirstName = $"Сидор{i}",
                    LastName = $"Работягов{i}",
                    EmailConfirmed = true
                };
                var resultEmp = await userManager.CreateAsync(worker, "password123");
                if (resultEmp.Succeeded)
                {
                    await userManager.AddToRoleAsync(worker, "Employee");
                }
            }
            else
            {
                // Если рабочий существует, проверяем его роль
                if (!await userManager.IsInRoleAsync(worker, "Employee"))
                {
                    await userManager.AddToRoleAsync(worker, "Employee");
                }
            }
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ошибка при накате миграций или сидинге данных");
    }
}

app.Run();