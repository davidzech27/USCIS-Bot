import WhatsApp from "./lib/whatsapp"

interface Env {
	PINECONE_API_KEY: string
	PINECONE_ENVIRONMENT: string
	PINECONE_INDEX: string
	OPENAI_SECRET_KEY: string
	WHATSAPP_WEBHOOK_TOKEN: string
	WHATSAPP_PHONE_NUMBER_ID: string
	META_ACCESS_TOKEN: string
}

interface MessageWebhookPayload {
	object: "whatsapp_business_account"
	entry: {
		id: string
		changes: {
			value: {
				messaging_product: "whatsapp"
				metadata: {
					display_phone_number: string
					phone_number_id: string
				}
				errors?: {
					code: number
					title: string
					message: string
					error_data: {
						details: string
					}
				}[]
			} & (
				| {
						contacts: {
							wa_id: string
							profile: {
								name: string
							}
						}[]
						messages: ({
							from: string
							id: string
							timestamp: string
							errors?: {
								code: number
								title: string
								message: string
								error_data: {
									details: string
								}
							}[]
						} & (
							| {
									button: {
										payload: string
										text: string
									}
									type: "button"
							  }
							| {
									text: {
										body: string
									}
									type: "text"
							  }
							| {
									interactive:
										| {
												type: "button_reply"
												button_reply: {
													id: string
													title: string
												}
										  }
										| {
												type: "list_reply"
												list_reply: {
													id: string
													title: string
													description: string
												}
										  }
									type: "interactive"
							  }
							| {
									type:
										| "audio"
										| "document"
										| "image"
										| "order"
										| "referral"
										| "sticker"
										| "system"
										| "video" // data on all other types are ignored
							  }
						))[]
				  }
				| {
						statuses: {
							conversation: {
								id: string
								origin: {
									type:
										| "business_initiated"
										| "customer_initiated"
										| "referral_conversion"
								}
								expiration_timestamp: string
							}
							id: string
							pricing: {
								category:
									| "business_initiated"
									| "customer_initiated"
									| "referral_conversion"
								pricing_model: "CBP"
							}
							recipient_id: string
							status: "delivered" | "read" | "sent"
							timestamp: string
							errors?: {
								code: number
								title: string
								message: string
								error_data: {
									details: string
								}
							}[]
						}[]
				  }
			)
			field: "messages"
		}[]
	}[]
}

export default {
	async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
		if (request.method === "POST") {
			const payload = (await request.json()) as MessageWebhookPayload

			console.log(JSON.stringify(payload, null, 4))

			const value = payload.entry[0]?.changes[0]?.value

			if (value !== undefined && "messages" in value) {
				const messages = value.messages

				const message = messages[0]

				if (message !== undefined) {
					let query: string

					if (message.type === "text") {
						query = message.text.body
					} else if (
						message.type === "interactive" &&
						message.interactive.type === "button_reply"
					) {
						query = message.interactive.button_reply.id
					} else {
						return new Response()
					}

					return new Response()
				} else {
					return new Response()
				}
			} else {
				return new Response()
			}
		} else if (request.method === "GET") {
			const { searchParams } = new URL(request.url)

			if (
				searchParams.get("hub.mode") === "subscribe" &&
				searchParams.get("hub.verify_token") === env.WHATSAPP_WEBHOOK_TOKEN
			) {
				return new Response(searchParams.get("hub.challenge")) // verify webhook
			} else {
				return new Response(null, { status: 400 })
			}
		} else {
			return new Response(null, { status: 405 })
		}
	},
}
