package com.wjl.es;

import com.wjl.es.domain.vo.TestVO;
import com.wjl.es.repository.TestRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@SpringBootTest
public class ESTest {
    @Autowired
    private TestRepository testRepository;

    @Test
    public void test() {
        TestVO testVO = new TestVO();
        testVO.setId(1L);
        testVO.setTitle("这是一个测试文本");
        testVO.setCreateTime(LocalDateTime.now());
        testRepository.save(testVO);

        TestVO ret = testRepository.findById("1").orElse(null);
        System.out.println(ret);
    }
}
