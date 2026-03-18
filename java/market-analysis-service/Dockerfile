FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/maven:3.9.9-eclipse-temurin-21-jammy AS build-stage

WORKDIR /app

COPY pom.xml .

RUN mvn dependency:go-offline -B

COPY src ./src

RUN mvn clean package -DskipTests -B

FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/openjdk:21-jdk-slim AS run-stage

ENV TZ=Asia/Shanghai
ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

RUN mkdir -p /app/config

ENV SPRING_CONFIG_LOCATION=file:/app/config/application.yml,classpath:/application.yml

WORKDIR /app

COPY --from=build-stage /app/target/market-analysis-service-0.0.1-SNAPSHOT.jar /app/app.jar

RUN chmod +x /app/app.jar

EXPOSE 8080
EXPOSE 8081

ENV JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC -Dfile.encoding=UTF-8 -Duser.timezone=Asia/Shanghai"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar -Dspring.config.location=$SPRING_CONFIG_LOCATION"]