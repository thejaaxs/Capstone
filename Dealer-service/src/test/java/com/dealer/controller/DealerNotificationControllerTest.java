package com.dealer.controller;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import com.dealer.controller.DealerNotificationController;
import com.dealer.entity.DealerNotification;
import com.dealer.service.DealerNotificationService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Arrays;

@ExtendWith(MockitoExtension.class)
public class DealerNotificationControllerTest {

    @Mock
    private DealerNotificationService service;

    @InjectMocks
    private DealerNotificationController controller;

    @Test
    void testUnreadCount() {

        when(service.unreadCount(1L)).thenReturn(3L);

        long result = controller.unreadCount(1L);

        assertEquals(3L, result);
    }

    @Test
    void testLatestNotifications() {

        DealerNotification n = new DealerNotification();

        when(service.latest(1L)).thenReturn(Arrays.asList(n));

        List<DealerNotification> result = controller.latest(1L);

        assertEquals(1, result.size());
    }
}