from starlette.testclient import TestClient


def test_server():
    """Some quick and dirty functional tests for the server"""
    import random
    import time
    from concurrent.futures import ThreadPoolExecutor

    client = TestClient(app)

    SIMULATED_CLIENTS = 50
    DUCKDB_PROJECTS = [
        "j_shop_1_duckdb",
        "j_shop_2_duckdb",
        "h_niceserver_1_duckdb",
        "h_niceserver_2_duckdb",
    ]
    PROJECTS = DUCKDB_PROJECTS

    e = ThreadPoolExecutor(max_workers=SIMULATED_CLIENTS)
    for proj in DUCKDB_PROJECTS:
        register_response = client.post(
            "/register",
            params={
                "project_dir": "./demo_duckdb",
                "profiles_dir": "./demo_duckdb",
                "target": "dev",
            },
            headers={"X-dbt-Project": proj},
        )
        print(register_response.json())
    STATEMENT = f"""
    {{% set payment_methods = ['credit_card', 'coupon', 'bank_transfer', 'gift_card'] %}}

    with orders as (

        select * from {{{{ ref('stg_orders') }}}}

    ),

    payments as (

        select * from {{{{ ref('stg_payments') }}}}

    ),

    order_payments as (

        select
            order_id,

            {{% for payment_method in payment_methods -%}}
            sum(case when payment_method = '{{{{ payment_method }}}}' then amount else 0 end) as {{{{ payment_method }}}}_amount,
            {{% endfor -%}}

            sum(amount) as total_amount

        from payments

        group by order_id

    ),

    final as (

        select
            orders.order_id,
            orders.customer_id,
            orders.order_date,
            orders.status,

            {{% for payment_method in payment_methods -%}}

            order_payments.{{{{ payment_method }}}}_amount,

            {{% endfor -%}}

            order_payments.total_amount as amount

        from orders


        left join order_payments
            on orders.order_id = order_payments.order_id

    )

    select * from final
    """
    LOAD_TEST_SIZE = 1000

    print("\n", "=" * 20)

    print("TEST COMPILE")
    t1 = time.perf_counter()
    futs = e.map(
        lambda i: client.post(
            "/compile",
            data=f"--> select {{{{ 1 + {i} }}}} \n{STATEMENT}",
            headers={"X-dbt-Project": random.choice(PROJECTS)},
        ).ok,
        range(LOAD_TEST_SIZE),
    )
    print("All Successful:", all(futs))
    t2 = time.perf_counter()
    print(
        (t2 - t1) / LOAD_TEST_SIZE,
        f"seconds per `/compile` across {LOAD_TEST_SIZE} calls from {SIMULATED_CLIENTS} simulated "
        f"clients randomly distributed between {len(PROJECTS)} different projects with a sql statement of ~{len(STATEMENT)} chars",
    )

    time.sleep(2.5)
    print("\n", "=" * 20)
    print(STATEMENT[:200], "\n...\n", STATEMENT[-200:])
    print("\n", "=" * 20)
    time.sleep(2.5)

    print("TEST RUN")
    t1 = time.perf_counter()
    futs = e.map(
        lambda i: client.post(
            "/run",
            data=f"-->> select {{{{ 1 + {i} }}}} \n{STATEMENT}",
            headers={"X-dbt-Project": random.choice(PROJECTS)},
        ).ok,
        range(LOAD_TEST_SIZE),
    )
    print("All Successful:", all(futs))
    t2 = time.perf_counter()
    print(
        (t2 - t1) / LOAD_TEST_SIZE,
        f"seconds per `/run` across {LOAD_TEST_SIZE} calls from {SIMULATED_CLIENTS} simulated "
        f"clients randomly distributed between {len(PROJECTS)} different projects with a sql statement of ~{len(STATEMENT)} chars",
    )
    e.shutdown(wait=True)