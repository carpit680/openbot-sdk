# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: comm.proto
# Protobuf Python Version: 5.29.0
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import runtime_version as _runtime_version
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC,
    5,
    29,
    0,
    '',
    'comm.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()




DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\ncomm.proto\x12\x07openbot\"\x10\n\x0e\x43onnectRequest\"\"\n\x0f\x43onnectResponse\x12\x0f\n\x07message\x18\x01 \x01(\t\"%\n\x12SendMessageRequest\x12\x0f\n\x07message\x18\x01 \x01(\t\"\x15\n\x13SendMessageResponse2\x97\x01\n\x0b\x43ommService\x12>\n\x07\x43onnect\x12\x17.openbot.ConnectRequest\x1a\x18.openbot.ConnectResponse0\x01\x12H\n\x0bSendMessage\x12\x1b.openbot.SendMessageRequest\x1a\x1c.openbot.SendMessageResponseb\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'comm_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  DESCRIPTOR._loaded_options = None
  _globals['_CONNECTREQUEST']._serialized_start=23
  _globals['_CONNECTREQUEST']._serialized_end=39
  _globals['_CONNECTRESPONSE']._serialized_start=41
  _globals['_CONNECTRESPONSE']._serialized_end=75
  _globals['_SENDMESSAGEREQUEST']._serialized_start=77
  _globals['_SENDMESSAGEREQUEST']._serialized_end=114
  _globals['_SENDMESSAGERESPONSE']._serialized_start=116
  _globals['_SENDMESSAGERESPONSE']._serialized_end=137
  _globals['_COMMSERVICE']._serialized_start=140
  _globals['_COMMSERVICE']._serialized_end=291
# @@protoc_insertion_point(module_scope)
