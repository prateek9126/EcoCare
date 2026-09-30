package com.example.evbatteryhealth.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.net.URI;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Autowired
    private Environment env;

    @Bean
    @Primary
    public DataSource dataSource() {
        // Priority 1: DATABASE_URL environment variable (Render, Railway, Heroku)
        String dbUrl = System.getenv("DATABASE_URL");
        if (dbUrl == null || dbUrl.isBlank() || dbUrl.contains("${")) {
            dbUrl = System.getenv("SPRING_DATASOURCE_URL");
        }
        if (dbUrl == null || dbUrl.isBlank() || dbUrl.contains("${")) {
            try {
                dbUrl = env.getProperty("spring.datasource.url");
            } catch (Exception ignored) {}
        }

        String configuredUsername = null;
        try {
            configuredUsername = env.getProperty("spring.datasource.username");
        } catch (Exception ignored) {}

        String configuredPassword = null;
        try {
            configuredPassword = env.getProperty("spring.datasource.password");
        } catch (Exception ignored) {}

        HikariConfig hikariConfig = new HikariConfig();
        hikariConfig.setDriverClassName("org.postgresql.Driver");

        // Handle case where dbUrl is null, empty, or literal placeholder '${...}'
        if (dbUrl == null || dbUrl.isBlank() || dbUrl.contains("${")) {
            log.warn("DATABASE_URL not set or unresolved. Falling back to local default PostgreSQL database.");
            dbUrl = "jdbc:postgresql://localhost:5432/EVCharging";
            hikariConfig.setJdbcUrl(dbUrl);
            hikariConfig.setUsername(configuredUsername != null && !configuredUsername.isBlank() ? configuredUsername : "postgres");
            hikariConfig.setPassword(configuredPassword != null && !configuredPassword.isBlank() ? configuredPassword : "Prateek@123");
        } else if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://") || dbUrl.startsWith("jdbc:postgres://")) {
            // Render / Heroku / Railway URL format:
            // postgres://username:password@host:port/database
            // or jdbc:postgres://...
            log.info("Parsing cloud PostgreSQL connection URL for Render/Cloud deployment...");
            if (dbUrl.startsWith("jdbc:postgres://")) {
                dbUrl = "postgres://" + dbUrl.substring("jdbc:postgres://".length());
            }

            try {
                parseAndApplyUri(dbUrl, hikariConfig, configuredUsername, configuredPassword);
            } catch (Exception ex) {
                log.warn("URI parsing failed ({}), falling back to regex parser: {}", ex.getMessage(), dbUrl);
                parseAndApplyRegex(dbUrl, hikariConfig, configuredUsername, configuredPassword);
            }
        } else if (dbUrl.startsWith("jdbc:postgresql://")) {
            // Standard JDBC URL
            hikariConfig.setJdbcUrl(dbUrl);
            if (configuredUsername != null && !configuredUsername.isBlank()) {
                hikariConfig.setUsername(configuredUsername);
            }
            if (configuredPassword != null && !configuredPassword.isBlank()) {
                hikariConfig.setPassword(configuredPassword);
            }
        } else {
            // Unknown prefix, prepend jdbc:postgresql:// if not present
            log.warn("Unexpected database URL format: {}. Attempting to adapt.", dbUrl);
            hikariConfig.setJdbcUrl("jdbc:postgresql://" + dbUrl);
            if (configuredUsername != null && !configuredUsername.isBlank()) hikariConfig.setUsername(configuredUsername);
            if (configuredPassword != null && !configuredPassword.isBlank()) hikariConfig.setPassword(configuredPassword);
        }

        hikariConfig.setMaximumPoolSize(10);
        hikariConfig.setMinimumIdle(2);
        hikariConfig.setConnectionTimeout(30000);
        hikariConfig.setIdleTimeout(600000);
        hikariConfig.setMaxLifetime(1800000);

        log.info("Configured DataSource with JDBC URL: {}", sanitizeUrl(hikariConfig.getJdbcUrl()));
        return new HikariDataSource(hikariConfig);
    }

    private void parseAndApplyUri(String rawUrl, HikariConfig config, String defaultUser, String defaultPass) throws Exception {
        URI uri = new URI(rawUrl);
        String host = uri.getHost();
        int port = uri.getPort() == -1 ? 5432 : uri.getPort();
        String path = uri.getPath();
        String dbName = (path != null && path.length() > 1) ? path.substring(1) : "";

        StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                .append(host)
                .append(":")
                .append(port)
                .append("/")
                .append(dbName);

        String query = uri.getQuery();
        if (query != null && !query.isBlank()) {
            jdbcUrl.append("?").append(query);
            if (!query.contains("sslmode") && !isLocalHost(host)) {
                jdbcUrl.append("&sslmode=require");
            }
        } else if (!isLocalHost(host)) {
            jdbcUrl.append("?sslmode=require");
        }

        config.setJdbcUrl(jdbcUrl.toString());

        String userInfo = uri.getUserInfo();
        if (userInfo != null && !userInfo.isBlank()) {
            String[] parts = userInfo.split(":", 2);
            config.setUsername(parts[0]);
            if (parts.length > 1) {
                config.setPassword(parts[1]);
            }
        } else {
            if (defaultUser != null && !defaultUser.isBlank()) config.setUsername(defaultUser);
            if (defaultPass != null && !defaultPass.isBlank()) config.setPassword(defaultPass);
        }
    }

    private void parseAndApplyRegex(String rawUrl, HikariConfig config, String defaultUser, String defaultPass) {
        Pattern pattern = Pattern.compile("(?:postgres|postgresql)://(?:([^:@]+)(?::([^@]*))?@)?([^:/?#]+)(?::(\\d+))?/(?:([^?#]*))?(?:\\?(.*))?");
        Matcher matcher = pattern.matcher(rawUrl);

        if (matcher.find()) {
            String user = matcher.group(1);
            String pass = matcher.group(2);
            String host = matcher.group(3);
            String portStr = matcher.group(4);
            int port = (portStr != null && !portStr.isBlank()) ? Integer.parseInt(portStr) : 5432;
            String dbName = matcher.group(5) != null ? matcher.group(5) : "";
            String query = matcher.group(6);

            StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                    .append(host)
                    .append(":")
                    .append(port)
                    .append("/")
                    .append(dbName);

            if (query != null && !query.isBlank()) {
                jdbcUrl.append("?").append(query);
                if (!query.contains("sslmode") && !isLocalHost(host)) {
                    jdbcUrl.append("&sslmode=require");
                }
            } else if (!isLocalHost(host)) {
                jdbcUrl.append("?sslmode=require");
            }

            config.setJdbcUrl(jdbcUrl.toString());
            config.setUsername(user != null ? user : defaultUser);
            config.setPassword(pass != null ? pass : defaultPass);
        } else {
            config.setJdbcUrl("jdbc:postgresql://" + rawUrl);
        }
    }

    private boolean isLocalHost(String host) {
        return host == null || host.equals("localhost") || host.equals("127.0.0.1") || host.equals("::1");
    }

    private String sanitizeUrl(String url) {
        if (url == null) return null;
        return url.replaceAll(":[^/@:]+@", ":****@");
    }
}
