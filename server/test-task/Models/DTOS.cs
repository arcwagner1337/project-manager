namespace test_task.Models
{
    public class ProjectResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string CustomerCompany { get; set; } = null!;
        public string ExecutorCompany { get; set; } = null!;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int Priority { get; set; }


        public int? ProjectManagerId { get; set; }
        public string? ProjectManagerName { get; set; } 

        public List<EmployeeShortDto> Employees { get; set; } = new();
    }

    public class EmployeeShortDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
    }


    public class CreateProjectDto
    {
        public string Name { get; set; } = null!;
        public string CustomerCompany { get; set; } = null!;
        public string ExecutorCompany { get; set; } = null!;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int Priority { get; set; }
        public int? ProjectManagerId { get; set; }
        public List<int> EmployeeIds { get; set; } = new(); 
    }



    public class LoginDto
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    public class UpdateProfileDto
    {
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string? MiddleName { get; set; }
        public string Email { get; set; } = null!;
        public string? CurrentPassword { get; set; }
        public string? NewPassword { get; set; }
    }

    public class CreateEmployeeDto
    {
        public string Email { get; set; } = null!;
        public string? Password { get; set; }
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string? MiddleName { get; set; }
        public string Role { get; set; } = "Employee";
    }

    public class UpdateEmployeeDto
    {
        public string Email { get; set; } = null!;
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string? MiddleName { get; set; }
        public string Role { get; set; } = "Employee";
    }
}
