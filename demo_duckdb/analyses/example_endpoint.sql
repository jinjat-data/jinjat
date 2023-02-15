{%- set query = request().query %}

select 1 as test where 1 = {{query.number}}