using Microsoft.AspNetCore.Authorization;
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
        [Authorize(Roles = "Leader,ProjectManager")]
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

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var document = new ProjectDocument
            {
                FileName = file.FileName,
                FilePath = Path.Combine("Uploads", uniqueFileName), 
                UploadedAt = DateTime.UtcNow,
                ProjectId = projectId
            };

            _context.ProjectDocuments.Add(document);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Файл успешно загружен", documentId = document.Id });
        }

        // GET: api/documents/project/5 (Get the list of project documents)
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

        // DELETE: api/documents/5 (Physically delete the document and remove it from the database)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Leader,ProjectManager")]
        public async Task<IActionResult> DeleteDocument(int id)
        {
            var document = await _context.ProjectDocuments.FindAsync(id);
            if (document == null)
            {
                return NotFound("Документ не найден");
            }

            var fullPath = Path.Combine(Directory.GetCurrentDirectory(), document.FilePath);
            if (System.IO.File.Exists(fullPath))
            {
                try
                {
                    System.IO.File.Delete(fullPath);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Не удалось удалить файл с диска: {ex.Message}");
                }
            }

            _context.ProjectDocuments.Remove(document);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Документ успешно удален" });
        }


        [HttpGet("download/{id}")]
        public async Task<IActionResult> DownloadDocument(int id)
        {

            var document = await _context.ProjectDocuments.FindAsync(id);
            if (document == null)
            {
                return NotFound(new { message = "Документ не найден в базе данных" });
            }

            var fullPath = Path.Combine(Directory.GetCurrentDirectory(), document.FilePath);
            if (!System.IO.File.Exists(fullPath))
            {
                return NotFound(new { message = "Физический файл не найден на сервере" });
            }

            var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(fullPath, out var contentType))
            {
                contentType = "application/octet-stream"; 
            }

            var fileStream = new FileStream(
                fullPath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                bufferSize: 4096,
                useAsync: true
            );

            return File(fileStream, contentType, document.FileName);
        }

    }
}
