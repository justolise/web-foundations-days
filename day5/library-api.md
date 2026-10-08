# Library API Design

This is a REST API for the **books** resource of a library. All paths start with `/api`. Data is sent and received as JSON.

## Endpoints

### 1. List all books
- **Method:** GET
- **Path:** `/api/books`
- **Description:** Returns every book in the library.
- **Request body:** none
- **Success status:** 200 OK

### 2. Get one book
- **Method:** GET
- **Path:** `/api/books/{id}`
- **Description:** Returns the book with the given id.
- **Request body:** none
- **Success status:** 200 OK

### 3. Create a book
- **Method:** POST
- **Path:** `/api/books`
- **Description:** Adds a new book to the library.
- **Example request body:**

```json
  {
    "title": "Weep Not, Child",
    "author": "Ngugi wa Thiong'o",
    "year": 1964,
    "isbn": "9780435908300"
  }
```

- **Success status:** 201 Created

### 4. Update a book
- **Method:** PUT
- **Path:** `/api/books/{id}`
- **Description:** Replaces the details of an existing book.
- **Example request body:**

```json
  {
    "title": "Weep Not, Child",
    "author": "Ngugi wa Thiong'o",
    "year": 1964,
    "isbn": "9780435908300"
  }
```

- **Success status:** 200 OK

### 5. Delete a book
- **Method:** DELETE
- **Path:** `/api/books/{id}`
- **Description:** Removes a book from the library.
- **Request body:** none
- **Success status:** 204 No Content

### 6. List books by an author
- **Method:** GET
- **Path:** `/api/books?author=Chinua%20Achebe`
- **Description:** Returns only the books written by the author in the query parameter.
- **Request body:** none
- **Success status:** 200 OK

## Error codes

### 400 Bad Request
The request is wrong or missing something.
- Example: `POST /api/books` with a body that has no `title`, or a `year` that is the text "abc" instead of a number.

### 404 Not Found
The book asked for does not exist.
- Example: `GET /api/books/9999` when no book has the id 9999.
- Example: `DELETE /api/books/9999` for a book that was already removed.