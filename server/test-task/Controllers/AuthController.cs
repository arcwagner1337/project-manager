using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using test_task.Models;

namespace test_task.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly SignInManager<Employee> _signInManager;
        private readonly UserManager<Employee> _userManager;

        public AuthController(SignInManager<Employee> signInManager, UserManager<Employee> userManager)
        {
            _signInManager = signInManager;
            _userManager = userManager;
        }

        // 1. Вход в систему
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            // Ищем сотрудника по Email
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null) return Unauthorized(new { message = "Неверный логин или пароль" });

            // Проверяем пароль и создаем сессию (куку)
            var result = await _signInManager.PasswordSignInAsync(user.UserName!, dto.Password, isPersistent: true, lockoutOnFailure: false);

            if (result.Succeeded)
            {
                var roles = await _userManager.GetRolesAsync(user);
                return Ok(new
                {
                    id = user.Id,
                    fullName = user.FullName,
                    email = user.Email,
                    role = roles.FirstOrDefault() ?? "Employee"
                });
            }

            return Unauthorized(new { message = "Неверный логин или пароль" });
        }

        // 2. Выход из системы
        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Ok(new { message = "Успешный выход" });
        }

        // 3. Проверка текущей сессии (Кто я?)
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            if (!User.Identity?.IsAuthenticated ?? true)
            {
                return Unauthorized(new { message = "Пользователь не авторизован" });
            }

            // Достаем ID из клеймов куки
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userIdString);
            if (user == null) return Unauthorized();

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                id = user.Id,
                fullName = user.FullName,
                email = user.Email,
                role = roles.FirstOrDefault() ?? "Employee"
            });
        }

        [HttpPut("update-profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            // Достаем ID текущего юзера из куки
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return Unauthorized();

            // 1. Обновляем имя напрямую из раздельных полей DTO
            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.MiddleName = dto.MiddleName;

            // 2. Если пользователь меняет Email
            if (!string.Equals(user.Email, dto.Email, StringComparison.OrdinalIgnoreCase))
            {
                var emailExists = await _userManager.FindByEmailAsync(dto.Email);
                if (emailExists != null)
                    return BadRequest(new { message = "Этот Email уже занят другим сотрудником" });

                user.Email = dto.Email;
                user.UserName = dto.Email; // Обычно Identity использует Email как UserName
            }

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
                return BadRequest(new { message = "Ошибка при обновлении профиля", errors = updateResult.Errors });

            // 3. Если запрошена смена пароля
            if (!string.IsNullOrEmpty(dto.CurrentPassword) && !string.IsNullOrEmpty(dto.NewPassword))
            {
                var passwordResult = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
                if (!passwordResult.Succeeded)
                {
                    var errorMsg = passwordResult.Errors.FirstOrDefault()?.Description ?? "Неверный текущий пароль";
                    return BadRequest(new { message = errorMsg });
                }
            }

            // КРИТИЧНО: Перевыпускаем куку авторизации с новыми данными
            await _signInManager.RefreshSignInAsync(user);

            var roles = await _userManager.GetRolesAsync(user);
            return Ok(new
            {
                id = user.Id,
                fullName = user.FullName, // Твое вычисляемое свойство модели соберет новое имя само
                email = user.Email,
                role = roles.FirstOrDefault() ?? "Employee"
            });
        }

    }

   
}