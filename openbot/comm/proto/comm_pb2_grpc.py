# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc
import warnings

from . import comm_pb2 as comm__pb2

GRPC_GENERATED_VERSION = '1.71.0'
GRPC_VERSION = grpc.__version__
_version_not_supported = False

try:
    from grpc._utilities import first_version_is_lower
    _version_not_supported = first_version_is_lower(GRPC_VERSION, GRPC_GENERATED_VERSION)
except ImportError:
    _version_not_supported = True

if _version_not_supported:
    raise RuntimeError(
        f'The grpc package installed is at version {GRPC_VERSION},'
        + f' but the generated code in comm_pb2_grpc.py depends on'
        + f' grpcio>={GRPC_GENERATED_VERSION}.'
        + f' Please upgrade your grpc module to grpcio>={GRPC_GENERATED_VERSION}'
        + f' or downgrade your generated code using grpcio-tools<={GRPC_VERSION}.'
    )


class CommServiceStub(object):
    """Missing associated documentation comment in .proto file."""

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.Connect = channel.unary_stream(
                '/openbot.CommService/Connect',
                request_serializer=comm__pb2.ConnectRequest.SerializeToString,
                response_deserializer=comm__pb2.ConnectResponse.FromString,
                _registered_method=True)
        self.SendMessage = channel.unary_unary(
                '/openbot.CommService/SendMessage',
                request_serializer=comm__pb2.SendMessageRequest.SerializeToString,
                response_deserializer=comm__pb2.SendMessageResponse.FromString,
                _registered_method=True)


class CommServiceServicer(object):
    """Missing associated documentation comment in .proto file."""

    def Connect(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def SendMessage(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_CommServiceServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'Connect': grpc.unary_stream_rpc_method_handler(
                    servicer.Connect,
                    request_deserializer=comm__pb2.ConnectRequest.FromString,
                    response_serializer=comm__pb2.ConnectResponse.SerializeToString,
            ),
            'SendMessage': grpc.unary_unary_rpc_method_handler(
                    servicer.SendMessage,
                    request_deserializer=comm__pb2.SendMessageRequest.FromString,
                    response_serializer=comm__pb2.SendMessageResponse.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'openbot.CommService', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))
    server.add_registered_method_handlers('openbot.CommService', rpc_method_handlers)


 # This class is part of an EXPERIMENTAL API.
class CommService(object):
    """Missing associated documentation comment in .proto file."""

    @staticmethod
    def Connect(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_stream(
            request,
            target,
            '/openbot.CommService/Connect',
            comm__pb2.ConnectRequest.SerializeToString,
            comm__pb2.ConnectResponse.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)

    @staticmethod
    def SendMessage(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(
            request,
            target,
            '/openbot.CommService/SendMessage',
            comm__pb2.SendMessageRequest.SerializeToString,
            comm__pb2.SendMessageResponse.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)
