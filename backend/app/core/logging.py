"""
Logging utilities for DataChart SaaS

Provides structured logging with proper configuration.
"""

import logging
import sys
from typing import Optional

def get_logger(name: str) -> logging.Logger:
    """
    Get a configured logger instance
    
    Args:
        name: Logger name (usually __name__)
    
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Only configure if not already configured
    if not logger.handlers:
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # Create console handler
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(formatter)
        
        # Configure logger
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False
    
    return logger