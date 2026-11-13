# running for building image
# docker network create network1
# docker build -f DockerContainer_Tomcat.dockerfile -t product-api .
# Use the official Tomcat image
FROM tomcat:10.1-jdk17
RUN rm -rf /usr/local/tomcat/webapps/ROOT
COPY target/demo-0.0.1-SNAPSHOT.war /usr/local/tomcat/webapps/ROOT.war
# Spring Boot API running on port 8080, so call API using http://localhost:8080/api/products
# by running docker run -d --name product-api-container --network network1 -p 8080:8080 product-api
# or using http://localhost:8081/api/products in case of
# running docker run -d --name product-api-container --network network1 -p 8081:8080 product-api
EXPOSE 8080
# Start Tomcat
CMD ["catalina.sh", "run"]