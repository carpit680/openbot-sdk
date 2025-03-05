# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc
import warnings

from . import image_stream_pb2 as image__stream__pb2

GRPC_GENERATED_VERSION = '1.70.0'
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
        + f' but the generated code in image_stream_pb2_grpc.py depends on'
        + f' grpcio>={GRPC_GENERATED_VERSION}.'
        + f' Please upgrade your grpc module to grpcio>={GRPC_GENERATED_VERSION}'
        + f' or downgrade your generated code using grpcio-tools<={GRPC_VERSION}.'
    )


class ImageStreamServiceStub(object):
    """Missing associated documentation comment in .proto file."""

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.StreamImages = channel.unary_stream(
                '/openbot.ImageStreamService/StreamImages',
                request_serializer=image__stream__pb2.ImageRequest.SerializeToString,
                response_deserializer=image__stream__pb2.ImageChunk.FromString,
                _registered_method=True)


class ImageStreamServiceServicer(object):
    """Missing associated documentation comment in .proto file."""

    def StreamImages(self, request, context):
        """When the client calls StreamImages with an ImageRequest,
        the server returns a stream of ImageChunk messages.
        """
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_ImageStreamServiceServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'StreamImages': grpc.unary_stream_rpc_method_handler(
                    servicer.StreamImages,
                    request_deserializer=image__stream__pb2.ImageRequest.FromString,
                    response_serializer=image__stream__pb2.ImageChunk.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'openbot.ImageStreamService', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))
    server.add_registered_method_handlers('openbot.ImageStreamService', rpc_method_handlers)


 # This class is part of an EXPERIMENTAL API.
class ImageStreamService(object):
    """Missing associated documentation comment in .proto file."""

    @staticmethod
    def StreamImages(request,
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
            '/openbot.ImageStreamService/StreamImages',
            image__stream__pb2.ImageRequest.SerializeToString,
            image__stream__pb2.ImageChunk.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)
