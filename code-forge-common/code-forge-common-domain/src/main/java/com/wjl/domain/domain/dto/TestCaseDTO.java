package com.wjl.domain.domain.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestCaseDTO {
    private String input;
    private String expectedOutput;
}
