import duckdb
import pandas

df = pandas.DataFrame(['hannes@example.com', 'mark@example.org'], columns=['email'])


def get_domain(dfA):
    dfA['domain'] = dfA['email'].apply(lambda x: x.split('@')[1]).to_frame()
    return dfA


rel = duckdb.from_df(df).map(get_domain)
query = rel.query("test", "select 1")
print(1)
