from typing import Optional

from jinjat.core.dbt.dbt_project import DbtProject
from fastapi.openapi.models import Schema

PYTHON_TO_JSON_SCHEMA = {
    "int": {"type": "integer"},
    "long": {"type": "integer"},
    "decimal": {"type": "string"},
    "float": {"type": "number"},
    "str": {"type": "string"},
    "unicode": {"type": "number"},
    "bytes": {"type": "number"},
    "bytearray": {"type": "number"},
    "bool": {"type": "boolean"},
    "bool_": {"type": "boolean"},
    "nonetype": {},
    "datetime": {"type": "string", "format": "date-time"},
    "sfdatetime": {"type": "string", "format": "date-time"},
    "date": {"type": "number", "format": "date"},
    "time": {"type": "number", "format": "time"},
    "struct_time": {"type": "string", "format": "time"},
    "timedelta": {"type": "string", "format": "duration"},
    "list": {"type": "array"},
    "tuple": {"type": "array"},
    "int8": {"type": "integer"},
    "int16": {"type": "integer"},
    "int32": {"type": "integer"},
    "int64": {"type": "integer"},
    "uint8": {"type": "integer"},
    "uint16": {"type": "integer"},
    "uint32": {"type": "integer"},
    "uint64": {"type": "integer"},
    "float16": {"type": "number"},
    "float32": {"type": "number"},
    "float64": {"type": "number"},
    "datetime64": {"type": "string", "format": "date-time"},
    "quoted_name": {"type": "string"},
}
ANSI_SQL_TYPE_PYTHON_TYPE = {
    "DECIMAL": "str",
    "REAL": "int",
    "DOUBLE PRECISION": "float",
    "FLOAT": "float",
    "SMALLINT": "int",
    "INTEGER": "int",
    "INTERVAL": "int",
    "VARCHAR": "str",
    "TEXT": "str",
    "CHARACTER": "str",
    "NUMERIC": "int",
    "BINARY": "str",
    "BIGINT": "int",
    "BOOLEAN": "bool",
    "DATE": "date",
    "TIME": "time",
    "TIMESTAMP": "datetime",
}
ADAPTER_TO_DATABASE = {
    "snowflake": {
        "TIMESTAMP_LTZ": "datetime",
        "TIMESTAMP_NTZ": "datetime",
        "TIMESTAMP_TZ": "datetime"
    }
}


def get_json_schema_from_data_type(project: DbtProject, data_type: Optional[str]) -> Schema:
    if data_type is not None:
        type_mapping = ADAPTER_TO_DATABASE.get(project.adapter.type())
        python_type = type_mapping.get(data_type.upper())
        if python_type is None:
            python_type = ANSI_SQL_TYPE_PYTHON_TYPE.get(data_type.upper())

        if python_type is not None:
            schema = PYTHON_TO_JSON_SCHEMA.get(python_type)
            if schema is not None:
                return Schema.parse_obj(schema)

    return Schema()
