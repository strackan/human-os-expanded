'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { VHSEffects } from '@/components/VHSEffects';
import { NeonButton } from '@/components/NeonButton';
import { MobileNav, DesktopNav } from '@/components/MobileNav';

interface Release {
  version: string;
  platform: string;
  filename: string;
  download_url: string;
  file_size: number | null;
  release_notes: string | null;
  published_at: string;
}

interface ReleasesResponse {
  windows: Release | null;
  macos: Release | null;
  'macos-arm64': Release | null;
  linux: Release | null;
  latest_version: string | null;
  release_notes: string | null;
}

type Platform = 'windows' | 'macos' | 'macos-arm64' | 'linux' | null;

const APPLE_ICON = (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const PLATFORM_CONFIG: Record<string, { name: string; icon: React.ReactNode; extension: string }> = {
  windows: {
    name: 'Windows',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
      </svg>
    ),
    extension: '.msi',
  },
  macos: {
    name: 'macOS (Intel)',
    icon: APPLE_ICON,
    extension: '.dmg',
  },
  'macos-arm64': {
    name: 'macOS (Apple Silicon)',
    icon: APPLE_ICON,
    extension: '.dmg',
  },
  linux: {
    name: 'Linux',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 01-.018-.2v-.02a1.772 1.772 0 01.15-.768c.082-.22.232-.406.43-.533a.985.985 0 01.594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 00-.166-.267.248.248 0 00-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 00-.12.27.944.944 0 00-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 01-.131.068 2.62 2.62 0 01-.275-.402 1.772 1.772 0 01-.155-.667 1.759 1.759 0 01.08-.668 1.43 1.43 0 01.283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 01.016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 01-.448-.067 3.566 3.566 0 01-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.839-.601.139-.036.294-.065.466-.065zm2.8 2.142c.358 1.417 1.196 3.475 1.735 4.473.286.534.855 1.659 1.102 3.024.156-.005.33.018.513.064.646-1.671-.546-3.467-1.089-3.966-.22-.2-.232-.335-.123-.335.59.534 1.365 1.572 1.646 2.757.13.535.16 1.104.021 1.67.067.028.135.06.205.067 1.032.534 1.413.938 1.23 1.537v-.002c-.06-.068-.136-.068-.299-.202-.09-.068-.2-.268-.373-.336-.085.135-.161.401-.243.535-.126.2-.316.4-.505.601-.057.268.005.67-.019 1.002-.032.4-.153.666-.39.867-.477.4-1.24.333-1.938-.002-.46-.22-.667-.667-.852-1.132-.09.135-.02.27-.02.402.08.467.154.936.394 1.403.135.267.173.535.222.803.293-.135.643-.263.878-.534.074-.069.127-.134.179-.2.129.079.268.2.405.334-.106.2-.303.402-.456.535-.16.129-.34.266-.567.399a2.64 2.64 0 01-.465.198c-.07.025-.133.06-.205.067h-.07c-.06.003-.12 0-.18-.003h-.015a2.88 2.88 0 01-1.235-.334 3.583 3.583 0 01-.986-.867c-.153-.2-.298-.4-.422-.6-.11-.135-.19-.2-.252-.334a3.52 3.52 0 00-.26-.4l-.003-.004c-.063-.064-.118-.13-.19-.198-.106-.135-.204-.27-.313-.338a2.18 2.18 0 00-.623-.267 1.725 1.725 0 01-.6-.135c-.025-.011-.054-.018-.08-.025a.602.602 0 01-.345-.333c-.054-.134-.04-.268.053-.402.116-.2.335-.267.58-.267.167 0 .35.026.564.133.2.066.37.133.524.267.135.067.27.134.367.268.09.066.183.135.264.202l.006.003c.063.034.13.061.2.067l.003.003c.038-.067.086-.2.086-.267 0-.07-.047-.135-.056-.203l-.004-.003c-.027-.201-.058-.4-.093-.6-.023-.066-.057-.132-.07-.198-.006-.039-.015-.076-.019-.11-.01-.072-.019-.134-.046-.2-.028-.135-.053-.27-.053-.402v-.003l-.004-.003c-.004-.065.002-.135-.012-.2-.022-.134-.059-.267-.06-.403-.01-.4-.037-.801.02-1.202a3.563 3.563 0 01.262-1.002c.08-.134.14-.334.232-.467l.003-.003c.018-.033.035-.068.051-.102-.008.003-.016.005-.024.005h-.016l-.006-.003c-.257.066-.455.27-.72.4-.2.133-.417.27-.655.4-.2.066-.4.132-.605.132-.135 0-.27-.027-.4-.134-.108-.103-.172-.244-.2-.403v-.003l-.003-.003a1.23 1.23 0 01.014-.202c.013-.134.023-.267.04-.4v-.003l.003-.003c.008-.039.015-.077.019-.115v-.003l.003-.003a1.16 1.16 0 00-.056-.408l-.003-.003v-.006l-.003-.003c-.008-.02-.012-.04-.02-.06-.07-.2-.168-.401-.298-.534-.106-.135-.264-.27-.475-.27H9.4c-.134 0-.268.068-.4.2-.135.135-.205.27-.243.535l-.003.003c-.01.066-.013.134-.02.202-.05.533.032 1.068.174 1.603.064.267.15.534.234.801a4.007 4.007 0 01.3.866l.003.003c.027.2.033.402.053.604v.003l.003.003c.014.131.028.264.034.4.013.267-.037.533-.112.8-.13.465-.386.867-.752 1.135-.316.2-.671.336-1.003.468-.18.068-.359.135-.54.203-.2.066-.4.132-.6.132-.066 0-.132-.015-.198-.046h-.003c-.131-.059-.202-.132-.27-.267-.068-.134-.1-.268-.115-.469v-.016c0-.2.07-.4.173-.602.1-.2.203-.334.32-.465.117-.135.237-.27.372-.4.13-.135.262-.27.39-.403.14-.134.282-.27.422-.4.148-.136.28-.268.418-.4v-.002l.003-.003a7.1 7.1 0 00.5-.535l.003-.003c.2-.27.336-.537.436-.87a2.69 2.69 0 00.108-.869c-.01-.399-.08-.798-.203-1.202-.09-.31-.195-.616-.32-.912z" />
      </svg>
    ),
    extension: '.AppImage',
  },
};

export default function DownloadPage() {
  const [releases, setReleases] = useState<ReleasesResponse | null>(null);
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>(null);
  const [loading, setLoading] = useState(true);
  const [activationCode, setActivationCode] = useState('');

  useEffect(() => {
    // Check for ?platform= override (e.g. /download?platform=macos)
    const params = new URLSearchParams(window.location.search);
    const override = params.get('platform') as Platform;
    if (override && PLATFORM_CONFIG[override]) {
      setDetectedPlatform(override);
    } else {
      // Detect platform from user agent
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('win')) {
        setDetectedPlatform('windows');
      } else if (ua.includes('mac')) {
        // Detect Apple Silicon: ARM-based Macs report "arm" in platform
        const isAppleSilicon =
          navigator.platform === 'MacIntel' && typeof (navigator as Record<string, unknown>).maxTouchPoints === 'number' && (navigator as Record<string, unknown>).maxTouchPoints as number > 0
          || /arm/i.test(navigator.platform);
        setDetectedPlatform(isAppleSilicon ? 'macos-arm64' : 'macos');
      } else if (ua.includes('linux')) {
        setDetectedPlatform('linux');
      }
    }

    // Fetch releases
    const fetchReleases = async () => {
      try {
        const res = await fetch('/api/releases');
        const data = await res.json();
        setReleases(data);
      } catch (err) {
        console.error('Failed to fetch releases:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, []);

  const getPrimaryRelease = () => {
    if (!releases || !detectedPlatform) return null;
    return releases[detectedPlatform];
  };

  const getOtherPlatforms = () => {
    if (!releases) return [];
    const platforms: Platform[] = ['windows', 'macos', 'macos-arm64', 'linux'];
    return platforms
      .filter((p) => p !== detectedPlatform && p && releases[p])
      .map((p) => ({ platform: p!, release: releases[p!]! }));
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const generateDeepLink = () => {
    if (!activationCode.trim()) return null;
    const code = activationCode.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    return `goodhang://activate/${code}`;
  };

  const primaryRelease = getPrimaryRelease();
  const otherPlatforms = getOtherPlatforms();

  return (
    <>
      <VHSEffects />

      <div className="min-h-screen relative">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-neon-purple/20">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="font-mono text-2xl font-bold chromatic-aberration">
              <span className="neon-purple">GOOD_HANG</span>
            </Link>
            <div className="flex gap-4 items-center">
              <DesktopNav
                links={[
                  { href: '/about', label: 'About' },
                  { href: '/download', label: 'Download' },
                  { href: '/login', label: 'Member Login' },
                ]}
              />
              <MobileNav
                links={[
                  { href: '/about', label: 'About' },
                  { href: '/download', label: 'Download' },
                  { href: '/login', label: 'Member Login' },
                ]}
              />
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold font-mono neon-magenta mb-6">
              DOWNLOAD
            </h1>
            <p className="text-xl text-foreground/80 font-mono mb-12">
              Get the Good Hang desktop client for your platform
            </p>

            {loading ? (
              <div className="animate-pulse">
                <div className="h-48 bg-neon-purple/10 rounded-lg mb-8" />
              </div>
            ) : (
              <>
                {/* Primary Download */}
                {primaryRelease && detectedPlatform && (
                  <div className="bg-background/50 border border-neon-cyan/30 rounded-lg p-8 mb-8">
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <span className="neon-cyan">
                        {PLATFORM_CONFIG[detectedPlatform].icon}
                      </span>
                      <h2 className="text-2xl font-mono font-bold">
                        {PLATFORM_CONFIG[detectedPlatform].name}
                      </h2>
                    </div>

                    <a
                      href={primaryRelease.download_url}
                      className="inline-block"
                    >
                      <NeonButton variant="cyan">
                        Download v{primaryRelease.version}
                      </NeonButton>
                    </a>

                    <p className="text-sm text-foreground/60 font-mono mt-4">
                      {primaryRelease.filename} ({formatFileSize(primaryRelease.file_size)})
                    </p>
                  </div>
                )}

                {/* Other Platforms */}
                {otherPlatforms.length > 0 && (
                  <div className="mb-12">
                    <h3 className="text-lg font-mono text-foreground/60 mb-4">
                      Other platforms
                    </h3>
                    <div className="flex justify-center gap-4 flex-wrap">
                      {otherPlatforms.map(({ platform, release }) => (
                        <a
                          key={platform}
                          href={release.download_url}
                          className="flex items-center gap-2 px-4 py-2 border border-neon-purple/30 rounded-lg hover:border-neon-purple/60 transition-colors"
                        >
                          <span className="text-neon-purple">
                            {PLATFORM_CONFIG[platform].icon}
                          </span>
                          <span className="font-mono">
                            {PLATFORM_CONFIG[platform].name}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Release Notes */}
                {releases?.release_notes && (
                  <div className="bg-background/30 border border-foreground/10 rounded-lg p-6 mb-12 text-left">
                    <h3 className="text-lg font-mono font-bold mb-3 neon-cyan">
                      What&apos;s New in v{releases.latest_version}
                    </h3>
                    <p className="font-mono text-sm text-foreground/80 whitespace-pre-wrap">
                      {releases.release_notes}
                    </p>
                  </div>
                )}

                {/* Activation Code Section */}
                <div className="bg-background/30 border border-neon-magenta/30 rounded-lg p-6">
                  <h3 className="text-lg font-mono font-bold mb-4">
                    Have an activation code?
                  </h3>
                  <p className="text-sm text-foreground/60 font-mono mb-4">
                    If you already have the app installed, enter your code below to generate a deep link.
                  </p>
                  <div className="flex gap-2 max-w-md mx-auto">
                    <input
                      type="text"
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value)}
                      placeholder="GH-XXXX-XXXX"
                      className="flex-1 px-4 py-2 bg-background border border-foreground/20 rounded-lg font-mono text-center tracking-wider focus:outline-none focus:border-neon-magenta/60"
                    />
                    {activationCode.trim() && (
                      <a
                        href={generateDeepLink() || '#'}
                        className="px-4 py-2 bg-neon-magenta/20 border border-neon-magenta/40 rounded-lg font-mono hover:bg-neon-magenta/30 transition-colors"
                      >
                        Open App
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
