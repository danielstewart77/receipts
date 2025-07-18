from functools import wraps

from flask import make_response, redirect, request, url_for
from flask_jwt_extended import create_access_token, decode_token, get_jwt_identity, set_access_cookies, verify_jwt_in_request

def optional_login(next_url):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            current_user = None
            try:
                # Check if the access token is valid
                verify_jwt_in_request(optional=True, refresh=True)
                current_user = get_jwt_identity()
                if current_user:
                    return fn(current_user, *args, **kwargs)
                else:
                    # If no valid access token, check the refresh token
                    refresh_token = request.cookies.get('refresh_token')
                    if refresh_token:
                        try:
                            decoded_refresh_token = decode_token(refresh_token)
                            current_user = decoded_refresh_token['sub']
                            new_access_token = create_access_token(identity=current_user)
                            resp = make_response(fn(current_user, *args, **kwargs))
                            set_access_cookies(resp, new_access_token)
                            return resp
                        except:
                            pass
            except:
                pass
            return fn(current_user, *args, **kwargs)
        return decorator
    return wrapper

def login_required_with_redirect(next_url):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            try:
                # Check if the access token is valid
                verify_jwt_in_request(optional=True, refresh=True)
                current_user = get_jwt_identity()
                if current_user:
                    return fn(*args, **kwargs)
                else:
                    # If no valid access token, check the refresh token
                    refresh_token = request.cookies.get('refresh_token')
                    if refresh_token:
                        try:
                            decoded_refresh_token = decode_token(refresh_token)
                            current_user = decoded_refresh_token['sub']
                            new_access_token = create_access_token(identity=current_user)
                            resp = make_response(redirect(next_url))
                            set_access_cookies(resp, new_access_token)
                            return resp
                        except:
                            # If refresh token is invalid, redirect to login
                            return redirect(url_for('auth.login', next=next_url))
                    else:
                        # If no refresh token, redirect to login
                        return redirect(url_for('auth.login', next=next_url))
            except Exception as e:
                
                return redirect(url_for('auth.login', next=next_url))
        return decorator
    return wrapper