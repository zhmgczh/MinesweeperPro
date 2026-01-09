import os, sys, http.server, webbrowser
from http.server import SimpleHTTPRequestHandler


def main(port: int = 8000, address: str = "./"):
    os.chdir(address)
    HandlerClass = SimpleHTTPRequestHandler
    ServerClass = http.server.HTTPServer
    Protocol = "HTTP/1.0"
    server_address = ("127.0.0.1", port)
    HandlerClass.protocol_version = Protocol
    httpd = ServerClass(server_address, HandlerClass)
    sa = httpd.socket.getsockname()
    print("Serving HTTP on", sa[0], "port", sa[1], "...")
    webbrowser.open("http://" + str(sa[0]) + ":" + str(sa[1]) + "/")
    httpd.serve_forever()


if "__main__" == __name__:
    import fire

    fire.Fire(main)
