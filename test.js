/**
 * MIT License
 *
 * Copyright (c) 2017 Draining Sun
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict"

const crypto = require("crypto")
const fs = require("fs")
const path = require("path")

const benchmark = require("benchmark")
const beautifyBenchmark = require("beautify-benchmark")

const farmhash = require("farmhash")
const murmurhash_native = require("murmurhash-native")
const xxhash_native = require("xxhash")
const xxhash_wasm = require("xxhash-wasm")
const wasm = require("hash-wasm")
const blake3 = require("blake3")

function promisify(callback) {
    return (...args) => new Promise(function(resolve, reject) {
        callback(resolve, ...args)
    })
}

function run(callback, expo) {
    const buffer = crypto.randomBytes(Math.pow(2, expo))

    const suite = new benchmark.Suite()

    suite.add("Node Crypto :: md5", () => {
        crypto
            .createHash("md5")
            .update(buffer)
            .digest()
    })

    suite.add("Node Crypto :: sha1", () => {
        crypto
            .createHash("sha1")
            .update(buffer)
            .digest()
    })

    // suite.add("Node Crypto :: sha512", () => {
    //     crypto
    //         .createHash("sha512")
    //         .update(buffer)
    //         .digest()
    // })

    suite.add("Blake3-WASM :: #32", () => {
        blake3.hash(buffer)
    })

    suite.add("FarmHash-Native :: #32", () => {
        farmhash.hash32(buffer)
    })

    // suite.add("FarmHash-Native :: FP #32", () => {
    //     farmhash.fingerprint32(buffer)
    // })

    suite.add("FarmHash-Native :: #64", () => {
        farmhash.hash64(buffer)
    })

    // suite.add("FarmHash-Native :: FP #64", () => {
    //     farmhash.fingerprint64(buffer)
    // })

    suite.add("murmurHash-Native :: #32", () => {
        murmurhash_native.murmurHash32(buffer)
    })

    suite.add("murmurHash-Native :: #64", () => {
        murmurhash_native.murmurHash64(buffer)
    })

    // suite.add("murmurHash-Native :: #128", () => {
    //     murmurhash_native.murmurHash128(buffer)
    // })

    suite.add("xxHash-Native #32", () => {
        xxhash_native.hash(buffer, 0xCAFEBABE)
    })

    suite.add("xxHash-Native #64", () => {
        xxhash_native.hash64(buffer, 0xCAFEBABE)
    })

    suite.add("xxHash-WASM :: #32", () => {
        xxhashWasmInstance.h32Raw(buffer)
    })

    suite.add("xxHash-WASM :: #64", () => {
        xxhashWasmInstance.h64Raw(buffer)
    })

    suite.add("WASM-Lib :: Blake3 #32", {
        defer: true,
        fn: async(deferred) => {
            await wasm.blake3(buffer)
            deferred.resolve()
        }
    })

    suite.add("WASM-Lib :: XXhash #32", {
        defer: true,
        fn: async(deferred) => {
            await wasm.xxhash32(buffer)
            deferred.resolve()
        }
    })

    suite.add("WASM-Lib :: XXhash #64", {
        defer: true,
        fn: async(deferred) => {
            await wasm.xxhash64(buffer)
            deferred.resolve()
        }
    })

    // suite.add("WASM-Lib :: XXhash #128", {
    //     defer: true,
    //     fn: async(deferred) => {
    //         await wasm.xxhash128(buffer)
    //         deferred.resolve()
    //     }
    // })

    // suite.add("WASM-Lib :: XXhash3 #??", {
    //     defer: true,
    //     fn: async(deferred) => {
    //         await wasm.xxhash3(buffer)
    //         deferred.resolve()
    //     }
    // })

    suite
        .on("start", () => {
            console.log("")
            console.log(`${buffer.length} bytes`)
        })
        .on("cycle", (event) => {
            beautifyBenchmark.add(event.target)
        })
        .on("complete", () => {
            beautifyBenchmark.log()

            console.log("Fastest is: " + suite.filter("fastest")[0].name)
            console.log("Slowest is: " + suite.filter("slowest")[0].name)

            callback();
        })
        .run({async: true})
}

const asyncRun = promisify(run)

let xxhashWasmInstance

async function main() {
    console.log("Preparing XXHash-Wasm...")
    // Pre-boot WASM for XXHash
    xxhashWasmInstance = await xxhash_wasm();

    console.log("Preparing WASM-Hash...")
    // Pre-initialize shorthand methods in WASM-Hash
    // From docs: "shorthand functions like md5() reuse the same WASM instance and state to do multiple calculations"
    const testBuffer = crypto.randomBytes(Math.pow(2, 6))
    await wasm.blake3(testBuffer)
    await wasm.xxhash32(testBuffer)
    await wasm.xxhash64(testBuffer)
    await wasm.xxhash128(testBuffer)
    await wasm.xxhash3(testBuffer)

    console.log("Starting benchmark...")
    //await asyncRun(6)
    await asyncRun(10)
    // await asyncRun(14)
    // await asyncRun(18)
    await asyncRun(20)
}

main()
