package com.dealer.exception;

public class DealerNotFoundByEmailException extends RuntimeException {

    public DealerNotFoundByEmailException(String message) {
        super(message);
    }
}
