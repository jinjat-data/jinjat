import time
from pathlib import Path

from watchdog.events import PatternMatchingEventHandler
from watchdog.observers.polling import PollingObserver


def get_current_time_milli():
    return int(round(time.time() * 1000))


def debouncer(callback, throttle_time_limit=100):
    last_millis = get_current_time_milli()

    def throttle(*args, **kwargs):
        nonlocal last_millis
        curr_millis = get_current_time_milli()
        if (curr_millis - last_millis) > throttle_time_limit:
            last_millis = get_current_time_milli()
            callback(*args, **kwargs)

    return throttle


def watch(directory: str, callback):
    callback_func = debouncer(callback, 2000)

    class DbtProjectWatcher(PatternMatchingEventHandler):
        patterns = ['*.sql',
                    '*.yml',
                    '*.mdx',
                    'jinjat_project.yml'
                    'dbt_project.yml']
        ignore_directories = []

        def on_any_event(self, event):
            callback_func(event)

    observer = PollingObserver()
    observer.schedule(DbtProjectWatcher(), directory, recursive=True)
    observer.start()


def get_project_root() -> Path:
    # TODO: What's the best way?
    return Path(__file__).parent.parent.parent.parent.parent
