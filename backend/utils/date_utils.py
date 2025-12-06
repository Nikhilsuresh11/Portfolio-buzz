"""
Date utilities for news filtering and date handling

This module provides centralized date utilities for consistent news filtering
across all services. All date filtering uses article published timestamps,
not the current time.
"""

from datetime import datetime, timedelta
from dateutil import parser as date_parser
import re


# Allowed days values for news filtering (used in frontend UI)
ALLOWED_DAYS = [1, 3, 7, 15, 30, 90]
DEFAULT_DAYS = 2  # Default to last 2 days (24-48 hours)


def get_default_days():
    """
    Get the default number of days for news filtering
    
    Returns:
        int: Default days (2)
    """
    return DEFAULT_DAYS


def validate_days_parameter(days):
    """
    Validate that days parameter is in allowed values
    
    Args:
        days: Number of days (int)
    
    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    try:
        days = int(days)
        if days in ALLOWED_DAYS:
            return True, None
        else:
            return False, f"Days must be one of: {', '.join(map(str, ALLOWED_DAYS))}"
    except (ValueError, TypeError):
        return False, "Days must be a valid integer"


def get_date_range_for_days(days):
    """
    Convert days parameter to datetime range
    
    Args:
        days: Number of days to look back
    
    Returns:
        tuple: (start_date: datetime, end_date: datetime)
    """
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    return start_date, end_date


def parse_published_date(date_str):
    """
    Parse published date from various formats to datetime object
    
    Handles:
    - ISO format strings
    - Relative dates (e.g., "2 hours ago")
    - Absolute date strings
    - datetime objects (passthrough)
    
    Args:
        date_str: Date string or datetime object
    
    Returns:
        datetime: Parsed datetime object (timezone-naive), or current time if parsing fails
    """
    if isinstance(date_str, datetime):
        # Remove timezone info to make it naive
        return date_str.replace(tzinfo=None) if date_str.tzinfo else date_str
    
    if not date_str or not isinstance(date_str, str):
        return datetime.now()
    
    try:
        # Try parsing as ISO format or standard date format
        parsed_dt = date_parser.parse(date_str)
        # Remove timezone info to make it naive for consistent comparison
        return parsed_dt.replace(tzinfo=None) if parsed_dt.tzinfo else parsed_dt
    except:
        # Try parsing relative dates (e.g., "2 hours ago")
        return _parse_relative_date(date_str)


def _parse_relative_date(date_str):
    """
    Convert relative date (e.g., '2 hours ago') to datetime object
    
    Args:
        date_str: Relative date string
    
    Returns:
        datetime: Parsed datetime object
    """
    try:
        now = datetime.now()
        date_str_lower = date_str.lower().strip()
        
        if not date_str_lower or date_str_lower == 'unknown':
            return now
        
        # Extract number from string
        numbers = re.findall(r'\d+', date_str)
        num = int(numbers[0]) if numbers else 1
        
        # Parse relative time
        if 'second' in date_str_lower or 'sec' in date_str_lower:
            return now - timedelta(seconds=num)
        elif 'minute' in date_str_lower or 'min' in date_str_lower:
            return now - timedelta(minutes=num)
        elif 'hour' in date_str_lower or 'hr' in date_str_lower:
            return now - timedelta(hours=num)
        elif 'day' in date_str_lower:
            return now - timedelta(days=num)
        elif 'week' in date_str_lower:
            return now - timedelta(weeks=num)
        elif 'month' in date_str_lower:
            return now - timedelta(days=num * 30)
        elif 'year' in date_str_lower:
            return now - timedelta(days=num * 365)
        else:
            return now
    except Exception as e:
        print(f"Error parsing relative date '{date_str}': {e}")
        return datetime.now()


def filter_articles_by_date(articles, days):
    """
    Filter articles by their published_at timestamp
    
    Args:
        articles: List of article dictionaries with 'published_at' field
        days: Number of days to filter (articles from last N days)
    
    Returns:
        list: Filtered articles within the date range
    """
    if not articles:
        return []
    
    start_date, end_date = get_date_range_for_days(days)
    filtered_articles = []
    
    for article in articles:
        published_at = article.get('published_at')
        
        if not published_at:
            # Skip articles without published date
            continue
        
        try:
            # Parse the published date
            published_dt = parse_published_date(published_at)
            
            # Check if within date range
            if start_date <= published_dt <= end_date:
                filtered_articles.append(article)
        except Exception as e:
            print(f"Error filtering article by date: {e}")
            # Skip articles with unparseable dates
            continue
    
    return filtered_articles


def sort_articles_by_date(articles, reverse=True):
    """
    Sort articles by published_at timestamp
    
    Args:
        articles: List of article dictionaries with 'published_at' field
        reverse: If True, sort latest → oldest (default). If False, oldest → latest
    
    Returns:
        list: Sorted articles
    """
    if not articles:
        return []
    
    def get_sort_key(article):
        """Get sortable datetime for article"""
        published_at = article.get('published_at', '')
        try:
            return parse_published_date(published_at)
        except:
            # Articles with unparseable dates go to the end
            return datetime.min if reverse else datetime.max
    
    return sorted(articles, key=get_sort_key, reverse=reverse)


def map_time_filter_to_days(time_filter):
    """
    Map time_filter string to number of days
    
    Used for backward compatibility with existing time_filter parameters
    
    Args:
        time_filter: Time filter string (hour, day, week, month, year, recent)
    
    Returns:
        int: Number of days
    """
    mapping = {
        'hour': 1,
        'day': 1,
        'week': 7,
        'month': 30,
        'year': 90,  # Cap at 90 days
        'recent': DEFAULT_DAYS
    }
    
    return mapping.get(time_filter.lower(), DEFAULT_DAYS)


def format_date_for_display(date_obj):
    """
    Format datetime object for display
    
    Args:
        date_obj: datetime object or ISO string
    
    Returns:
        str: Formatted date string
    """
    if isinstance(date_obj, str):
        date_obj = parse_published_date(date_obj)
    
    if isinstance(date_obj, datetime):
        return date_obj.strftime('%Y-%m-%d %H:%M:%S')
    
    return str(date_obj)
