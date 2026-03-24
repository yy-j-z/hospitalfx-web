package com.hospitalfx.backend.controller;

import com.hospitalfx.backend.dto.LoginRequest;
import com.hospitalfx.backend.dto.LoginResponse;
import com.hospitalfx.backend.repository.UserRepository;
import com.hospitalfx.backend.service.AppStateService;
import com.hospitalfx.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final AppStateService appStateService;
    private final AuthService authService;

    public AuthController(UserRepository userRepository, AppStateService appStateService, AuthService authService) {
        this.userRepository = userRepository;
        this.appStateService = appStateService;
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return userRepository.findByLoginId(request.loginId().trim())
            .filter(item -> item.getPassword().equals(request.password()))
            .filter(item -> Boolean.TRUE.equals(item.getEnabled()))
            .map(user -> new LoginResponse(authService.createSession(user), appStateService.toSummary(user)))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "账号或密码错误"));
    }
}
