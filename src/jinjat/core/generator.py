import os
import sys

from jinjat.core.dbt.dbt_project import DbtTarget, DbtProjectContainer
from pathlib import Path
from jinjat.core.log_controller import logger

space = '    '
branch = '│   '
# pointers:
tee = '├── '
last = '└── '


def print_tree(dir_path: Path, prefix: str = ''):
    """A recursive generator, given a directory Path object
    will yield a visual tree structure line by line
    with each line prefixed by the same characters
    """
    contents = list(dir_path.iterdir())
    print(contents)
    # contents each get pointers that are ├── with a final └── :
    pointers = [tee] * (len(contents) - 1) + [last]
    for pointer, path in zip(pointers, contents):
        yield prefix + pointer + path.name
        if path.is_dir():  # extend the prefix and recurse:
            extension = branch if pointer == tee else space
            # i.e. space because last, └── , above so no more |
            yield from print_tree(path, prefix=prefix + extension)


def compile_macro(dbt_target: DbtTarget, macro_name: str, macro_args: str, dry_run: bool = False):
    container = DbtProjectContainer()
    container.add_project(dbt_target)
    project = container.get_default_project()
    macro_result = project.execute_macro(macro_name, macro_args)

    if type(macro_result) != dict:
        logger().fatal(
            "Generator macro needs to return dict[file_path, file_context] but it returned %s the following output: %s",
            type(macro_result), macro_result)
        sys.exit(1)

    files = [(os.path.join(dbt_target.project_dir, path), content) for path, content in macro_result.items()]

    if len(files) == 0:
        logger().info("Macro returned empty object, exiting..")
        sys.exit(0)

    logger().info("Project directory is %s, macro returned %s files to generate", dbt_target.project_dir, len(files))

    if dry_run:
        sys.exit(0)

    dir_structure = generate_dir_structure(list(macro_result.keys()))
    print_dir_structure(dbt_target.project_dir, dir_structure)

    number_of_existing_files = sum(os.path.exists(file[0]) for file in files)
    if number_of_existing_files > 0:
        prompt_message = f"There are {number_of_existing_files} files that you will be overwritten. Type '{number_of_existing_files}' and enter to continue"
        check = str(number_of_existing_files)
    else:
        prompt_message = f"{len(files)} files will be created. Type enter to continue"
        check = ""

    user_output = input(f'{prompt_message}\n')
    if not user_output == check:
        logger().info("Exiting without doing any action.")
        sys.exit(0)

    for (path, content) in files:
        with open(path, "w") as f:
            f.write(content)


# ChatGTP generated the following code
def generate_dir_structure(file_paths):
    dir_structure = {}
    for path in file_paths:
        curr_dir = dir_structure
        components = path.split('/')
        for i, component in enumerate(components[:-1]):
            if component not in curr_dir:
                curr_dir[component] = {}
            curr_dir = curr_dir[component]
            if i == len(components) - 2:
                curr_dir[components[-1]] = path
    return dir_structure


def print_dir_structure(project_dir: str, dir_structure, indent=''):
    # Define the characters used to create the tree-like output
    branch_char = '├── '
    last_branch_char = '└── '
    indent_char = '│   '
    last_indent_char = '    '
    # Iterate over each directory or file in the current directory
    for i, (name, contents) in enumerate(dir_structure.items()):
        # Determine the character to use for the current directory or file
        if i == len(dir_structure) - 1:
            curr_branch_char = last_branch_char
        else:
            curr_branch_char = branch_char
        # Print the current directory or file
        if contents is not None and type(contents) != str:
            print(indent + curr_branch_char + name)
            if i == len(dir_structure) - 1:
                sub_indent = indent + last_indent_char
            else:
                sub_indent = indent + indent_char
            print_dir_structure(project_dir, contents, indent=sub_indent)
        else:
            if os.path.exists(os.path.join(project_dir, contents)):
                sign = '❗️'
            else:
                sign = '✔️'
            print(indent + curr_branch_char + name + ' ' + sign)
