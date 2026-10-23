FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY . .

RUN chmod +x gradlew

EXPOSE 8080

CMD ["./gradlew", "bootRun", "--no-daemon"]