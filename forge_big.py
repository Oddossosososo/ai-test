"""
Cookie Forge Big — Python reference engine.

Python integers/Decimal are used for tooling and validation. The browser
loads ForgeBig.js; this module is for offline tests, generators and future
build tooling.
"""
from decimal import Decimal, getcontext

getcontext().prec = 1000


def big(value: str | int | Decimal) -> Decimal:
    return Decimal(str(value))


def add(a, b): return big(a) + big(b)
def sub(a, b): return big(a) - big(b)
def mul(a, b): return big(a) * big(b)
def div(a, b): return big(a) / big(b)
def power(a, n): return big(a) ** int(n)


def scientific(value, places=12):
    return format(big(value), f'.{places}E').replace('E', 'e')


if __name__ == '__main__':
    x = big('9.999e1000') * 2
    print(scientific(x))
