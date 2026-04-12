package com.ecommerce.config;

import com.ecommerce.entity.Role;
import com.ecommerce.entity.User;
import com.ecommerce.enums.RoleName;
import com.ecommerce.repository.RoleRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // ===== Seed Roles =====
        if (roleRepository.count() == 0) {
            roleRepository.save(new Role(null, RoleName.ROLE_USER));
            roleRepository.save(new Role(null, RoleName.ROLE_ADMIN));
            log.info("Roles seeded: ROLE_USER, ROLE_ADMIN");
        }

        // ===== Seed Admin User =====
        Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseThrow();

        if (!userRepository.existsByEmailIgnoreCase("admin@eshop.com")) {
            User admin = User.builder()
                    .name("Admin")
                    .email("admin@eshop.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .phone("9999999999")
                    .isActive(true)
                    .emailVerified(true)
                    .roles(Set.of(adminRole))
                    .build();

            userRepository.save(admin);
            log.info("Admin user seeded -> email: admin@eshop.com, password: Admin@123");
        } else {
            User admin = userRepository.findByEmailIgnoreCase("admin@eshop.com").orElseThrow();
            boolean updated = false;

            if (!admin.isActive()) {
                admin.setActive(true);
                updated = true;
            }
            if (!admin.isEmailVerified()) {
                admin.setEmailVerified(true);
                updated = true;
            }
            if (admin.getRoles().stream().noneMatch(role -> role.getName() == RoleName.ROLE_ADMIN)) {
                admin.getRoles().add(adminRole);
                updated = true;
            }

            if (updated) {
                userRepository.save(admin);
                log.info("Default admin account restored and activated: {}", admin.getEmail());
            }
        }
    }
}
