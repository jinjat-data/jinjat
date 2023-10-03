from pathlib import Path

from watchdog.events import LoggingEventHandler, PatternMatchingEventHandler, FileSystemEventHandler
from watchdog.observers import Observer
from watchdog.observers.polling import PollingObserver


def watch(directory: str, callback):
    class DbtProjectWatcher(PatternMatchingEventHandler):
        patterns = ['analysis/**/*.sql',
                    'analyses/**/*.yml',
                    'macros/**/*.sql',
                    'macros/**/*.yml',
                    'models/**/*.sql',
                    'models/**/*.yml',
                    'dbt_project.yml']

        def on_any_event(self, event):
            callback(event)

    observer = PollingObserver()
    observer.schedule(DbtProjectWatcher(), directory, recursive=True)
    observer.start()


def get_project_root() -> Path:
    # TODO: What's the best way?
    return Path(__file__).parent.parent.parent.parent.parent
