# School Database Design

## The tables

### students
Stores one row for each student: an `id`, their `name` and their `email`. The email is `UNIQUE`, so two students cannot share the same one.

### courses
Stores one row for each course: an `id`, a `title` and a short `code` such as WF101. The code is also `UNIQUE`.

### enrolments
Stores the fact that a student is on a course. Each row has a `student_id`, a `course_id` and a `grade`. The grade can be empty (NULL) until the student is marked. The pair (`student_id`, `course_id`) is `UNIQUE`, so a student cannot enrol on the same course twice.

## Relationships

- **One student has many enrolments.** One student can be on many courses, but each enrolment row belongs to only one student. This is one-to-many.
- **One course has many enrolments.** One course can have many students, but each enrolment row belongs to only one course. This is also one-to-many.
- **Students and courses together are many-to-many.** A student can take many courses, and a course can have many students.

### Why we need a join table
A relational table cannot hold a list inside one cell. If we put a "courses" column in `students`, we would have to squeeze several courses into one value, which makes searching and updating messy. The `enrolments` table solves this by turning one many-to-many relationship into two one-to-many relationships. It is also the right place to keep the grade, because the grade belongs to the student and course together, not to either one alone.

## An index I would add

```sql
CREATE INDEX idx_enrolments_course_id ON enrolments(course_id);
```

**Reason:** we often ask "which students are on this course?" and "how many students are on each course?". Those queries search by `course_id`. The `UNIQUE (student_id, course_id)` rule already helps searches by student, but not by course. An index on `course_id` lets the database jump straight to the right rows instead of reading the whole table, which matters when there are thousands of enrolments.

## SQL or NoSQL?

I would choose SQL for this system. School data is made of clear, connected things (students, courses and enrolments) and the connections matter. SQL can enforce rules for me, such as a unique email, no double enrolment, and no enrolment for a student that does not exist. It also handles questions like "how many students are on each course?" well, with JOIN and GROUP BY. School records also need to be correct, so the safety of transactions is valuable. NoSQL could be a better fit for very large amounts of loosely structured data or very fast scaling, but a school system does not need that.