from modal import Image, Stub, asgi_app, Mount

image = Image.debian_slim().pip_install("boto3")
project_dir = "/Users/bkabak/Code/jinjat/jaffle_shop_metrics"

stub = Stub(mounts=[Mount.from_local_dir(project_dir, remote_path="/root/project")])


@stub.function(image=image)
@asgi_app(label="jinjat")
def fastapi_app():
    return web_app