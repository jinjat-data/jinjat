from jinja2 import Environment, PackageLoader, select_autoescape
from jinja2.defaults import BLOCK_START_STRING, BLOCK_END_STRING, VARIABLE_START_STRING, VARIABLE_END_STRING, \
    COMMENT_START_STRING, COMMENT_END_STRING


def compile():
    env = Environment(
        block_start_string=f'[{BLOCK_START_STRING}]',
        block_end_string=f'[{BLOCK_END_STRING}]',
        variable_start_string=f'[{VARIABLE_START_STRING}]',
        variable_end_string=f'[{VARIABLE_END_STRING}]',
        comment_start_string=f'[{COMMENT_START_STRING}]',
        comment_end_string=f'[{COMMENT_END_STRING}]',
        loader=PackageLoader("yourapp"),
        autoescape=select_autoescape())

    template = env.get_template("mytemplate.html")
    print(template.render(the="variables", go="here"))
