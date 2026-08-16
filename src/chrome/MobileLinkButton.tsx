import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { getKitConfig } from '../configure';
import { WzrdModal } from '../WzrdModal';

export function MobileLinkButton() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { sportswzrdBaseUrl } = getKitConfig();

	return (
		<div>
			<div className="wz-relative wz-inline-block">
				<button
					onClick={() => setIsModalOpen(true)}
					className="wz-flex wz-items-center wz-gap-2 wz-px-3 wz-h-10 wz-rounded wz-font-bold wz-text-sm wz-text-gray-700 wz-bg-white wz-border wz-border-gray-300 hover:wz-border-blue-500 wz-transition-all wz-duration-200 wz-ease-in-out hover:wz-shadow-sm wz-cursor-pointer"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="wz-h-5 wz-w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#666666"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
						<path d="M12 18h.01" />
					</svg>
					Use on mobile
				</button>
			</div>
			<WzrdModal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} width="450px">
				<div className="wz-flex wz-flex-col wz-gap-6 wz-p-2">
					<div className="wz-text-center wz-pb-2 wz-border-b wz-border-gray-100">
						<h2 className="wz-text-2xl wz-font-bold wz-text-gray-800 wz-mb-2">
							📱 Mobile Experience
						</h2>
						<p className="wz-text-gray-600 wz-text-sm">Access SportsWZRD on your mobile device</p>
					</div>

					<div className="wz-flex wz-flex-col wz-items-center wz-gap-4 wz-bg-gray-50 wz-p-6 wz-rounded-lg">
						<div className="wz-p-3 wz-bg-white wz-rounded-xl wz-shadow-md">
							<QRCodeCanvas
								value={sportswzrdBaseUrl}
								size={200}
								bgColor="#ffffff"
								fgColor="#000000"
								level="H"
							/>
						</div>
						<div className="wz-text-center">
							<p className="wz-text-base wz-font-semibold wz-text-gray-800 wz-mb-1">
								Scan the QR Code
							</p>
							<p className="wz-text-sm wz-text-gray-600">
								to access SportsWZRD on your mobile device
							</p>
						</div>
					</div>

					<div className="wz-flex wz-justify-end wz-gap-3 wz-mt-2">
						<button
							onClick={() => setIsModalOpen(false)}
							className="wz-bg-blue-500 wz-text-white wz-px-6 wz-py-2.5 wz-rounded-lg wz-font-medium hover:wz-bg-blue-600 wz-transition-colors wz-duration-200 wz-shadow-sm hover:wz-shadow-md wz-cursor-pointer"
						>
							Got it
						</button>
					</div>
				</div>
			</WzrdModal>
		</div>
	);
}
