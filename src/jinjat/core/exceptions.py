import sys
from typing import Optional

from pydantic import BaseModel

class DbtExecutionError(BaseModel):
    raw_sql: str
    compiled_sql: Optional[str]
    error: str

class InvalidJinjaConfig(Exception):

    def __init__(self, schema_file_path: str, sql_file_path: str, *args: object) -> None:
        first_arg = f"Error processing config for model in {sql_file_path} under ${schema_file_path}. {args[0]}"
        super().__init__(first_arg, *args[1:])
        self.schema_file_path = schema_file_path
        self.sql_file_path = sql_file_path



class ExecuteSqlFailure(RuntimeError):

    def __init__(self, raw_sql: str, compiled_sql: Optional[str], dbt_exception: Exception):
        self.raw_sql = raw_sql
        self.compiled_sql = compiled_sql
        self.dbt_exception = dbt_exception

    def to_model(self) -> DbtExecutionError:
        return DbtExecutionError(raw_sql=self.raw_sql, compiled_sql=self.compiled_sql, error=str(self.dbt_exception))

class SanitizationRequired(Exception):
    pass
