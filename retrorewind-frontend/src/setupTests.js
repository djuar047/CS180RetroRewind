import "@testing-library/jest-dom";

// Polyfill TextEncoder/TextDecoder for Jest
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
