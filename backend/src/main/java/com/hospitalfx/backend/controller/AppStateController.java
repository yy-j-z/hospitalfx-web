package com.hospitalfx.backend.controller;

import com.hospitalfx.backend.dto.AppStateResponse;
import com.hospitalfx.backend.service.AppStateService;
import com.hospitalfx.backend.service.AuthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/app")
public class AppStateController {

    private final AppStateService appStateService;
    private final AuthService authService;

    public AppStateController(AppStateService appStateService, AuthService authService) {
        this.appStateService = appStateService;
        this.authService = authService;
    }

    @GetMapping("/state")
    public AppStateResponse state(@RequestHeader(value = "X-Auth-Token", required = false) String token) {
        return appStateService.loadStateFor(authService.requireUser(token));
    }

    @PostMapping("/reset")
    public AppStateResponse reset(@RequestHeader(value = "X-Auth-Token", required = false) String token) {
        return appStateService.loadStateFor(authService.requireUser(token));
    }
}
