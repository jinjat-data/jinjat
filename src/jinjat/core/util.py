from dataclasses import dataclass
from enum import Enum
from typing import Optional, Any, List

from fastapi.exceptions import HTTPException
from pydantic import BaseModel, ValidationError
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import HTMLResponse, Response, JSONResponse
from watchdog.events import LoggingEventHandler, PatternMatchingEventHandler
from watchdog.observers import Observer


def get_human_readable_error(validation_error: ValidationError) -> str:
    error_str = "Validation errors:\n"
    for error in validation_error.errors():
        error_str += f'-> {error.get("loc")}: {error.get("msg")}\n'
    return error_str


class JinjatErrorCode(int, Enum):
    FailedToReachServer = -1
    CompileSqlFailure = 1
    ExecuteSqlFailure = 2
    ProjectParseFailure = 3
    ProjectNotFound = 4
    ProjectHeaderNotSupplied = 5
    SqlNotSupplied = 6


class JinjatError(BaseModel):
    code: JinjatErrorCode
    error: Any


class JinjatErrorContainer(HTTPException):
    def __init__(self, status_code: int, error: JinjatError) -> None:
        super().__init__(status_code, error.dict())


class DbtTarget(BaseModel):
    project_dir: str
    profiles_dir: str
    target: Optional[str]


class DbtExecutionError(BaseModel):
    raw_sql: str
    compiled_sql: Optional[str]
    error: str


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


@dataclass
class CustomButton:
    name: str
    url: str


async def rapidoc_html(custom_button: CustomButton, request: Request) -> HTMLResponse:
    html = f"""
        <!doctype html>
        <html>
            <head>
                <meta charset="utf-8">
                <script 
                    type="module" 
                    src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"
                ></script>
            </head>
            <body>
                <rapi-doc spec-url="openapi.json" 
                          primary-color="#DCBB0E" render-style="focused" 
                          show-method-in-nav-bar="as-colored-block" 
                          show-header="false" 
                          show-curl-before-try="true">
                    <div slot="overview">
                        <a href="openapi.json" style="color:#DCBB0E">openapi.json</a><br>
                    </div>
                    <div slot="nav-logo">
                        <img src="https://jinjat.com/img/jinjat-logo.svg" style="height:35px;margin-left: 7px;">
                        {f'<a href="{custom_button.url}" style="background: #DCBB0E;padding: 0 8px;border-radius: 3px;font-weight: bold;color: #000;text-decoration: none;line-height: 35px;height: 35px;float: right;margin-right: 7px;">{custom_button.name}</a>' if custom_button is not None else ""}
                    </div>
                </rapi-doc>
            </body> 
        </html>
    """
    return HTMLResponse(html)


class JSONAPIResponse(JSONResponse):
    """
    Base response class for json:api requests, sets `Content-Type: application/vnd.api+json`.
    For detailed information, see `Starlette responses <https://www.starlette.io/responses/>`_.
    """
    media_type = 'application/vnd.api+json'

    def render(self, content: Any) -> bytes:
        if content is None:
            return b''
        return super().render(content)


class JSONAPIException(HTTPException):
    """ HTTP exception with json:api representation. """

    def __init__(self, status_code: int, detail: str = None, errors: List[dict] = None) -> None:
        """
        Base json:api exception class.
        :param status_code: HTTP status code
        :param detail: Optional, error detail, will be serialized in the final HTTP response.
                       **DO NOT** include sensitive information here.
                       If not specified, the HTTP message associated to ``status_code``
                       will be used.
        :param errors: Optional, list of json:api error representations.
                       Used if multiple errors are returned.
                       .. code-block:: python
                           import json
                           from starlette_jsonapi.utils import serialize_error
                           error1 = JSONAPIException(400, 'foo')
                           error2 = JSONAPIException(400, 'bar')
                           final_error = JSONAPIException(
                               400, 'final', errors=error1.errors + error2.errors
                           )
                           response = serialize_error(final_error)
                           assert json.loads(response.body)['errors'] == [
                               {'detail': 'foo'},
                               {'detail': 'bar'},
                               {'detail': 'final'},
                           ]
        """
        super().__init__(status_code, detail=detail)
        self.errors = errors or []
        self.errors.append({'detail': self.detail})


def register_jsonapi_exception_handlers(app: Starlette):
    """
    Registers exception handlers on a Starlette app,
    serializing uncaught Exception and HTTPException to a json:api compliant body.
    """

    def serialize_error(exc: Exception) -> JSONAPIResponse:
        """
        Serializes exception according to the json:api spec
        and returns the equivalent :class:`JSONAPIResponse`.
        """
        if isinstance(exc, JSONAPIException):
            status_code = exc.status_code
            errors = exc.errors
        elif isinstance(exc, HTTPException):
            status_code = exc.status_code
            errors = [{'detail': exc.detail}]
        else:
            status_code = 500
            errors = [{'detail': 'Internal server error'}]

        error_body = {
            'errors': errors
        }
        return JSONAPIResponse(status_code=status_code, content=error_body)

    async def _serialize_error(request: Request, exc: Exception) -> Response:
        return serialize_error(exc)

    app.add_exception_handler(Exception, _serialize_error)
    app.add_exception_handler(HTTPException, _serialize_error)
