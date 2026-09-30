# ==========================================
# Stage 1: Build Spring Boot application
# ==========================================
FROM maven:3.9.9-eclipse-temurin-21 AS builder

WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# ==========================================
# Stage 2: Run Spring Boot application
# ==========================================
FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

ENV PORT=10000
EXPOSE 10000

ENTRYPOINT ["sh", "-c", "java -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Dserver.port=${PORT:-10000} -jar app.jar"]