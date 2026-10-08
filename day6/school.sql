-- School database (SQLite)

-- Make SQLite check foreign keys (it is off by default)
PRAGMA foreign_keys = ON;

-- Delete old tables so this file can be run again and again
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- ---------- Tables ----------

CREATE TABLE students (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
  id    INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  code  TEXT NOT NULL UNIQUE
);

CREATE TABLE enrolments (
  id         INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL,
  course_id  INTEGER NOT NULL,
  grade      INTEGER CHECK (grade BETWEEN 0 AND 100),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (course_id)  REFERENCES courses(id),
  -- The same student cannot join the same course twice
  UNIQUE (student_id, course_id)
);

-- ---------- Sample data ----------

INSERT INTO students (id, name, email) VALUES
  (1, 'Amina Hassan',   'amina@example.com'),
  (2, 'Brian Otieno',   'brian@example.com'),
  (3, 'Cynthia Wanjiru', 'cynthia@example.com'),
  (4, 'David Kimani',   'david@example.com');

INSERT INTO courses (id, title, code) VALUES
  (1, 'Web Foundations', 'WF101'),
  (2, 'Databases',       'DB101'),
  (3, 'JavaScript Basics', 'JS101');

-- grade is empty (NULL) when a student has not been graded yet
INSERT INTO enrolments (student_id, course_id, grade) VALUES
  (1, 1, 78),
  (1, 3, 90),
  (2, 1, 65),
  (2, 2, 70),
  (3, 1, 88),
  (3, 2, NULL);

-- ---------- Queries ----------

-- 1. All courses for one student (by name)
SELECT courses.title, enrolments.grade
FROM students
JOIN enrolments ON students.id = enrolments.student_id
JOIN courses    ON courses.id  = enrolments.course_id
WHERE students.name = 'Amina Hassan';

-- 2. All students on one course
SELECT students.name, students.email
FROM courses
JOIN enrolments ON courses.id  = enrolments.course_id
JOIN students   ON students.id = enrolments.student_id
WHERE courses.title = 'Web Foundations';

-- 3. The number of students per course
SELECT courses.title, COUNT(enrolments.id) AS number_of_students
FROM courses
LEFT JOIN enrolments ON courses.id = enrolments.course_id
GROUP BY courses.id, courses.title;

-- 4. Students who have no enrolments
SELECT students.name, students.email
FROM students
LEFT JOIN enrolments ON students.id = enrolments.student_id
WHERE enrolments.id IS NULL;

-- 5. Update one enrolment's grade (Brian's grade in Databases)
UPDATE enrolments
SET grade = 85
WHERE student_id = (SELECT id FROM students WHERE name = 'Brian Otieno')
  AND course_id  = (SELECT id FROM courses  WHERE title = 'Databases');

-- Check that the update worked
SELECT students.name, courses.title, enrolments.grade
FROM enrolments
JOIN students ON students.id = enrolments.student_id
JOIN courses  ON courses.id  = enrolments.course_id
WHERE students.name = 'Brian Otieno';