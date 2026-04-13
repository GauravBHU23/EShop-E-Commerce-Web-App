# Enterprise E-Commerce Backend — Spring Boot

A production-grade e-commerce backend built with Spring Boot 3.2, covering every major backend concept.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Spring Boot 3.2 |
| Language | Java 17 |
| Security | Spring Security + JWT |
| Database | PostgreSQL 16 |
| ORM | JPA / Hibernate |
| Cache | Caffeine |
| Email | Spring Mail + Thymeleaf |
| Docs | Swagger / OpenAPI 3 |
| Build | Maven |
| Deploy | Docker + Docker Compose |

---

## Project Structure

```
src/main/java/com/ecommerce/
├── config/         SecurityConfig, CacheConfig, SwaggerConfig, DataInitializer
├── controller/     AuthController, UserController, ProductController,
│                   CategoryController, CartController, OrderController,
│                   ReviewController, AdminController
├── dto/
│   ├── request/    LoginRequest, RegisterRequest, ProductRequest, OrderRequest ...
│   └── response/   ApiResponse, JwtResponse, ProductResponse, OrderResponse ...
├── entity/         User, Product, Category, Cart, Order, Payment, Review, Coupon ...
├── enums/          OrderStatus, PaymentMode, PaymentStatus, RoleName
├── exception/      GlobalExceptionHandler, ResourceNotFoundException ...
├── repository/     UserRepository, ProductRepository, OrderRepository ...
├── security/       JwtTokenProvider, JwtAuthFilter, UserDetailsServiceImpl
├── service/        AuthService, ProductService, CartService, OrderService ...
└── util/           SlugUtil, FileUploadService
```

---

## Quick Start

### 1. Clone & Configure

```bash
git clone https://github.com/yourname/ecommerce-backend.git
cd ecommerce-backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials and mail settings
```

### 2. Create Database

```sql
CREATE DATABASE ecommerce_db;
```

### 3. Run Locally

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### 4. Run with Docker

```bash
docker-compose up --build
```

Optional database UI:

```bash
docker-compose --profile tools up -d pgadmin
```

App starts at: `http://localhost:8080`
Swagger UI: `http://localhost:8080/swagger-ui/index.html`

---

## Default Admin Credentials

After first startup, `DataInitializer` seeds:

```
Email:    admin@eshop.com
Password: Admin@123
```

---

## API Reference

### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login, get JWT | No |
| POST | `/api/auth/forgot-password` | Send reset email | No |
| POST | `/api/auth/reset-password` | Reset with token | No |

### User
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/users/me` | Get my profile | Yes |
| PUT | `/api/users/me` | Update profile | Yes |
| POST | `/api/users/me/avatar` | Upload avatar | Yes |
| PUT | `/api/users/me/password` | Change password | Yes |
| GET | `/api/users/me/addresses` | List addresses | Yes |
| POST | `/api/users/me/addresses` | Add address | Yes |
| PUT | `/api/users/me/addresses/{id}` | Update address | Yes |
| DELETE | `/api/users/me/addresses/{id}` | Delete address | Yes |

### Products
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/products` | List all (paginated) | No |
| GET | `/api/products/{id}` | Get by ID | No |
| GET | `/api/products/search` | Search & filter | No |
| GET | `/api/products/category/{id}` | By category | No |
| POST | `/api/products` | Create product | Admin |
| PUT | `/api/products/{id}` | Update product | Admin |
| DELETE | `/api/products/{id}` | Delete product | Admin |

### Cart
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/cart` | Get my cart | Yes |
| POST | `/api/cart/items` | Add item | Yes |
| PUT | `/api/cart/items/{productId}` | Update quantity | Yes |
| DELETE | `/api/cart/items/{productId}` | Remove item | Yes |

### Orders
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/orders` | Place order | Yes |
| GET | `/api/orders` | My order history | Yes |
| GET | `/api/orders/{id}` | Get order detail | Yes |
| POST | `/api/orders/{id}/cancel` | Cancel order | Yes |

### Reviews
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/products/{id}/reviews` | Get reviews | No |
| POST | `/api/products/{id}/reviews` | Add review | Yes |
| PUT | `/api/products/{id}/reviews/{rid}` | Update review | Yes |
| DELETE | `/api/products/{id}/reviews/{rid}` | Delete review | Yes |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/dashboard` | Dashboard analytics |
| GET | `/api/admin/users` | All users (paginated) |
| PATCH | `/api/admin/users/{id}/toggle-status` | Enable/disable user |
| GET | `/api/admin/orders` | All orders |
| PATCH | `/api/admin/orders/{id}/status` | Update order status |
| GET | `/api/admin/inventory/low-stock` | Low stock products |
| PATCH | `/api/admin/inventory/products/{id}/restock` | Restock product |
| GET | `/api/admin/coupons` | All coupons |
| POST | `/api/admin/coupons` | Create coupon |
| PATCH | `/api/admin/coupons/{id}/toggle` | Enable/disable coupon |

---

## Order Status Flow

```
PLACED → CONFIRMED → SHIPPED → DELIVERED
   ↓          ↓
CANCELLED  CANCELLED
```

---

## Running Tests

```bash
# All tests
mvn test

# Specific test class
mvn test -Dtest=AuthServiceTest

# With coverage report
mvn test jacoco:report
```

---

## Deployment (Render / Railway)

1. Push code to GitHub
2. Create new Web Service on Render/Railway
3. Set all environment variables from `.env.example`
4. Build command: `mvn clean package -DskipTests`
5. Start command: `java -Dspring.profiles.active=prod -jar target/ecommerce-backend-1.0.0.jar`

---

## Topics Covered

- Spring Boot 3 project structure
- REST API (GET, POST, PUT, DELETE, PATCH)
- JPA/Hibernate (OneToMany, ManyToMany, self-join)
- Spring Security + JWT
- BCrypt password encoding
- Role-based access control (@PreAuthorize)
- Global Exception Handling (@ControllerAdvice)
- Bean Validation (@Valid, @NotBlank, @Email)
- Pagination & Sorting (Pageable, Page<T>)
- Multipart file upload
- Spring Mail + Thymeleaf email templates
- Caffeine Caching (@Cacheable, @CacheEvict)
- @Transactional (order placement with stock deduction)
- @Scheduled (low stock alert cron job)
- Soft delete pattern
- DTO pattern + Response wrapper
- Unit tests (JUnit 5 + Mockito)
- Integration tests (@WebMvcTest)
- Docker + Docker Compose
- Multi-environment config (dev/prod profiles)
- Swagger/OpenAPI documentation
