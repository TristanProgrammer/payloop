# Property Management SaaS - Africa's Talking SMS Integration

A comprehensive Java Spring Boot application for property management with integrated SMS functionality using Africa's Talking API.

## Features

- **Property Management**: Manage multiple properties and units
- **Tenant Management**: Complete tenant lifecycle management
- **Automated SMS Reminders**: Rent reminders, overdue notices, payment confirmations
- **Scheduled Jobs**: Daily automated SMS campaigns
- **Admin Panel**: Manual SMS sending capabilities
- **Comprehensive Logging**: Track all SMS activities and costs

## Technologies Used

- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Data JPA**
- **Spring Security**
- **MySQL Database**
- **Africa's Talking Java SDK**
- **Maven**
- **JUnit 5** (Testing)

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- MySQL 8.0+
- Africa's Talking account with API credentials

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd property-management-sms
```

### 2. Database Setup

Create a MySQL database:

```sql
CREATE DATABASE propman_db;
```

### 3. Environment Variables

Set the following environment variables or update `application.properties`:

```bash
# Database
export DB_USERNAME=your_db_username
export DB_PASSWORD=your_db_password

# Africa's Talking
export AT_API_KEY=atsk_ffd5e7269057fedcc6bf0d52e7a1f5e30ddcc4f7e2542278ee5e708ffbf6b85567ebad6a
export AT_USERNAME=sandbox
export AT_ENVIRONMENT=sandbox

# SMS Configuration
export SMS_SENDER_NAME=PropMan
export SMS_MPESA_PAYBILL=696385
export SMS_MPESA_PHONE=0705441549
```

### 4. Build and Run

```bash
# Build the application
mvn clean compile

# Run tests
mvn test

# Start the application
mvn spring-boot:run
```

The application will start on `http://localhost:8080/api`

## API Endpoints

### SMS Endpoints

#### Send Rent Reminder
```http
POST /api/sms/rent-reminder/{tenantId}?daysBefore=3
```

#### Send Overdue Notice
```http
POST /api/sms/overdue-notice/{tenantId}?daysOverdue=5
```

#### Send Payment Confirmation
```http
POST /api/sms/payment-confirmation/{tenantId}?amount=30000
```

#### Send Welcome Message
```http
POST /api/sms/welcome/{tenantId}
```

#### Send Bulk Rent Reminders
```http
POST /api/sms/bulk-rent-reminders
Content-Type: application/json

{
  "tenantIds": [1, 2, 3],
  "daysBefore": 3
}
```

#### Send Custom SMS
```http
POST /api/sms/custom
Content-Type: application/json

{
  "phone": "+254722123456",
  "message": "Your custom message here",
  "tenantId": 1,
  "landlordId": 1
}
```

#### Get SMS Logs
```http
GET /api/sms/logs?page=0&size=20&sortBy=sentAt&sortDir=desc&landlordId=1
```

## Scheduled Jobs

### Daily Rent Reminders
- **Schedule**: Every day at 9:00 AM
- **Function**: Sends rent reminders 3 days before due date
- **Cron**: `0 0 9 * * *`

### Daily Overdue Notices
- **Schedule**: Every day at 10:00 AM
- **Function**: Sends overdue notices to defaulting tenants
- **Cron**: `0 0 10 * * *`

## SMS Templates

### Rent Reminder
```
Hi {tenantName}, your rent of KES {amount} for {propertyName} Unit {unitNumber} is due on {dueDate}. 
Pay via M-Pesa: Paybill 696385 or Send to 0705441549. Thank you.
```

### Overdue Notice
```
Hi {tenantName}, your rent of KES {amount} for {propertyName} Unit {unitNumber} is {daysOverdue} days overdue. 
Please settle immediately to avoid penalties. Contact: 0705441549
```

### Payment Confirmation
```
Hi {tenantName}, we confirm receipt of KES {amount} rent payment for {propertyName} Unit {unitNumber}. 
Thank you for your prompt payment.
```

### Welcome Message
```
Welcome to {propertyName}, {tenantName}! Your rent of KES {amount} is due on the {dueDate} of each month. 
Pay via M-Pesa: Paybill 696385 or Send to 0705441549. Contact us for any assistance.
```

## Testing

Run the test suite:

```bash
mvn test
```

## Production Deployment

### 1. Update Configuration

For production, update `application.properties`:

```properties
# Use production database
spring.datasource.url=jdbc:mysql://your-prod-db:3306/propman_db

# Use production Africa's Talking credentials
africas.talking.environment=production
africas.talking.api.key=${AT_PROD_API_KEY}
africas.talking.username=${AT_PROD_USERNAME}
```

### 2. Build Production JAR

```bash
mvn clean package -DskipTests
```

### 3. Run Production Application

```bash
java -jar target/property-management-sms-1.0.0.jar
```

## Monitoring and Health Checks

The application includes Spring Boot Actuator endpoints:

- **Health Check**: `GET /api/actuator/health`
- **Application Info**: `GET /api/actuator/info`
- **Metrics**: `GET /api/actuator/metrics`

## Cost Management

SMS costs are automatically calculated and logged:

- **Standard SMS (≤160 chars)**: KES 1.00
- **Long SMS (161-320 chars)**: KES 2.00
- **Extra Long SMS (321+ chars)**: KES 3.00

## Security

- **Authentication**: Spring Security with role-based access
- **Authorization**: `@PreAuthorize` annotations on endpoints
- **Input Validation**: Bean validation on all DTOs
- **Phone Number Validation**: Kenyan phone number format validation

## Error Handling

- Comprehensive exception handling
- Detailed logging for debugging
- Graceful failure handling for SMS operations
- Automatic retry mechanisms for failed SMS

## Support

For issues and questions:

1. Check the application logs
2. Verify Africa's Talking account status
3. Ensure database connectivity
4. Review environment variables

## License

This project is licensed under the MIT License.
```