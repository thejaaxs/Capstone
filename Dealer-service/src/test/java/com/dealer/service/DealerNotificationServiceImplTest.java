package com.dealer.service;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import com.dealer.entity.DealerNotification;
import com.dealer.repository.DealerNotificationRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.List;
import java.util.Arrays;

@ExtendWith(MockitoExtension.class)
public class DealerNotificationServiceImplTest {

    @Mock
    private DealerNotificationRepository repo;

    @InjectMocks
    private DealerNotificationServiceImpl service;

    @Test
    void testCreateNotification() {

        DealerNotification n = DealerNotification.builder()
                .dealerId(1L)
                .type("BOOKING")
                .message("New booking")
                .build();

        when(repo.save(any())).thenReturn(n);

        DealerNotification result = service.create(1L, "BOOKING", "New booking");

        assertEquals("BOOKING", result.getType());
    }

    @Test
    void testUnreadCount() {

        when(repo.countByDealerIdAndReadFlagFalse(1L)).thenReturn(2L);

        long result = service.unreadCount(1L);

        assertEquals(2L, result);
    }

    @Test
    void testLatestNotifications() {

        DealerNotification n = new DealerNotification();

        when(repo.findTop10ByDealerIdOrderByCreatedAtDesc(1L))
                .thenReturn(Arrays.asList(n));

        List<DealerNotification> result = service.latest(1L);

        assertEquals(1, result.size());
    }

    @Test
    void testNotificationNotFound() {

        when(repo.findById(10L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> service.markRead(1L, 10L));
    }

    @Test
    void testUnauthorizedDealer() {

        DealerNotification n = new DealerNotification();
        n.setDealerId(2L);

        when(repo.findById(1L)).thenReturn(Optional.of(n));

        assertThrows(RuntimeException.class,
                () -> service.markRead(1L, 1L));
    }
}