import pytest

import jinjat.core.server


@pytest.fixture(scope="session", autouse=True)
def register_dbt_project():
    for name_override, project_dir in [
        ("dbt_project", "tests/sqlfluff_templater/fixtures/dbt/dbt_project")
    ]:
        jinjat.core.server.app.state.dbt_project_container.add_project(
            name_override=name_override,
            project_dir=project_dir,
            profiles_dir="tests/sqlfluff_templater/fixtures/dbt/profiles_yml",
            target="dev",
        )
