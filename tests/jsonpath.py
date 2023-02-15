import jmespath

path = jmespath.search('[0]', [{'foo': 2}])

print(path)