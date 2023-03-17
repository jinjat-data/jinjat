from watchdog.events import LoggingEventHandler, PatternMatchingEventHandler
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

    observer = Observer()
    observer.schedule(DbtProjectWatcher, directory, recursive=True)
    observer.start()
