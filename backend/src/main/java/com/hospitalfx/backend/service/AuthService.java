package com.hospitalfx.backend.service;

import com.hospitalfx.backend.model.UserAccount;
import com.hospitalfx.backend.repository.UserRepository;
import java.util.Arrays;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final Map<String, Integer> sessions = new ConcurrentHashMap<>();

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String createSession(UserAccount user) {
        String token = UUID.randomUUID().toString();
        sessions.put(token, user.getId());
        return token;
    }

    public UserAccount requireUser(String token) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "未登录或登录已失效");
        }
        Integer userId = sessions.get(token.trim());
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "未登录或登录已失效");
        }
        return userRepository.findById(userId)
            .filter(user -> Boolean.TRUE.equals(user.getEnabled()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户不存在或已停用"));
    }

    public void requireAnyRole(UserAccount user, String... roles) {
        boolean matched = Arrays.stream(roles).anyMatch(role -> role.equals(user.getRoleCode()));
        if (!matched) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "无权访问当前资源");
        }
    }
}
