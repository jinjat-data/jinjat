from pathlib import Path

from watchdog.events import LoggingEventHandler, PatternMatchingEventHandler
from watchdog.observers import Observer
from watchdog.observers.polling import PollingObserver


def watch(directory: str, callback):
    class DbtProjectWatcher(LoggingEventHandler,
                            PatternMatchingEventHandler(patterns=['analysis/*.sql',
                                                                  'analysis/*.yml',
                                                                  'macros/*.sql',
                                                                  'models/*.sql',
                                                                  'dbt_project.yml'])):

        def on_any_event(self, event):
            super().on_any_event(event)
            callback(directory)

    observer = PollingObserver()
    observer.schedule(DbtProjectWatcher, directory, recursive=True)
    observer.start()

def get_project_root() -> Path:
    # TODO: What's the best way?
    return Path(__file__).parent.parent.parent.parent.parent
