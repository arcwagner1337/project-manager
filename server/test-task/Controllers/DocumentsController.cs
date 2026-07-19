using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using test_task.Data;
using test_task.Models;


namespace test_task.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentsController : Controller
    {
        private readonly AppDbContext _context;

        public DocumentsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("upload/{projectId}")]
        public async Task<IActionResult> UploadDocument(int projectId, IFormFile file)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null)
            {
                return NotFound("Проект не найден");
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest("Файл не выбран или пуст");
            }

            // 1. Создаем папку "Uploads" в корне сервера, если её нет
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // 2. Генерируем уникальное имя файла, чтобы избежать перезаписи
            var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // 3. Физически сохраняем файл на диск сервера
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // 4. Записываем информацию о документе в базу данных
            var document = new ProjectDocument
            {
                FileName = file.FileName,
                FilePath = Path.Combine("Uploads", uniqueFileName), // Относительный путь
                UploadedAt = DateTime.UtcNow,
                ProjectId = projectId
            };

            _context.ProjectDocuments.Add(document);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Файл успешно загружен", documentId = document.Id });
        }

        // 2. GET: api/documents/project/5 (Получить список документов проекта)
        [HttpGet("project/{projectId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetProjectDocuments(int projectId)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null)
            {
                return NotFound("Проект не найден");
            }

            var documents = await _context.ProjectDocuments
                .Where(d => d.ProjectId == projectId)
                .Select(d => new
                {
                    d.Id,
                    d.FileName,
                    d.UploadedAt
                })
                .ToListAsync();

            return Ok(documents);
        }

        // 3. DELETE: api/documents/5 (Удалить документ физически и из базы)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(int id)
        {
            var document = await _context.ProjectDocuments.FindAsync(id);
            if (document == null)
            {
                return NotFound("Документ не найден");
            }

            // Пытаемся удалить файл физически с диска
            var fullPath = Path.Combine(Directory.GetCurrentDirectory(), document.FilePath);
            if (System.IO.File.Exists(fullPath))
            {
                try
                {
                    System.IO.File.Delete(fullPath);
                }
                catch (Exception ex)
                {
                    // Если файл занят процессом или нет прав, просто залогируем, но запись из БД все равно сотрем
                    Console.WriteLine($"Не удалось удалить файл с диска: {ex.Message}");
                }
            }

            // Удаляем запись из БД
            _context.ProjectDocuments.Remove(document);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Документ успешно удален" });
        }


        [HttpGet("download/{id}")]
        public async Task<IActionResult> DownloadDocument(int id)
        {
            // 1. Ищем запись в правильной таблице — ProjectDocuments
            var document = await _context.ProjectDocuments.FindAsync(id);
            if (document == null)
            {
                return NotFound(new { message = "Документ не найден в базе данных" });
            }

            // 2. Собираем полный путь к файлу на сервере, как в твоем DeleteDocument
            var fullPath = Path.Combine(Directory.GetCurrentDirectory(), document.FilePath);
            if (!System.IO.File.Exists(fullPath))
            {
                return NotFound(new { message = "Физический файл не найден на сервере" });
            }

            // 3. Определяем MIME-тип файла по его расширению (чтобы картинки открывались как картинки, а pdf как pdf)
            var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(fullPath, out var contentType))
            {
                contentType = "application/octet-stream"; // Дефолтный тип для бинарных файлов
            }

            // 4. Открываем асинхронный поток чтения
            var fileStream = new FileStream(
                fullPath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                bufferSize: 4096,
                useAsync: true
            );

            // 5. Отдаем файл в браузер с оригинальным именем
            return File(fileStream, contentType, document.FileName);
        }

    }
}
