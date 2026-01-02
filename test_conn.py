import asyncio
import asyncpg

async def test():
    conn = await asyncpg.connect('postgresql://postgres@localhost:5432/authz_authn_test_db?ssl=disable')
    print('Connected!')
    await conn.close()

asyncio.run(test())
