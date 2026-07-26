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

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null) return Unauthorized(new { message = "Неверный логин или пароль" });

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

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Ok(new { message = "Успешный выход" });
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            if (!User.Identity?.IsAuthenticated ?? true)
            {
                return Unauthorized(new { message = "Пользователь не авторизован" });
            }

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
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return Unauthorized();

            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.MiddleName = dto.MiddleName;

            if (!string.Equals(user.Email, dto.Email, StringComparison.OrdinalIgnoreCase))
            {
                var emailExists = await _userManager.FindByEmailAsync(dto.Email);
                if (emailExists != null)
                    return BadRequest(new { message = "Этот Email уже занят другим сотрудником" });

                user.Email = dto.Email;
                user.UserName = dto.Email; 
            }

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
                return BadRequest(new { message = "Ошибка при обновлении профиля", errors = updateResult.Errors });

            if (!string.IsNullOrEmpty(dto.CurrentPassword) && !string.IsNullOrEmpty(dto.NewPassword))
            {
                var passwordResult = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
                if (!passwordResult.Succeeded)
                {
                    var errorMsg = passwordResult.Errors.FirstOrDefault()?.Description ?? "Неверный текущий пароль";
                    return BadRequest(new { message = errorMsg });
                }
            }

            await _signInManager.RefreshSignInAsync(user);

            var roles = await _userManager.GetRolesAsync(user);
            return Ok(new
            {
                id = user.Id,
                fullName = user.FullName, 
                email = user.Email,
                role = roles.FirstOrDefault() ?? "Employee"
            });
        }

    }

   
}